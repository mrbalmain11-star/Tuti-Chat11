create schema room_pin;
revoke all on schema room_pin from public,anon,authenticated,service_role;
create table room_pin.config (
  singleton boolean primary key default true check(singleton),
  pepper bytea not null
);
insert into room_pin.config(pepper) values(extensions.gen_random_bytes(32));
create table room_pin.locks (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  digest text not null
);
create table room_pin.attempts (
  room_id uuid references public.rooms(id) on delete cascade,
  actor uuid references auth.users(id) on delete cascade,
  failures integer not null default 0,
  retry_at timestamptz,
  last_attempt timestamptz not null default clock_timestamp(),
  primary key(room_id,actor)
);
create table room_pin.budget (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  window_start timestamptz not null,
  hits integer not null
);
create table room_pin.admissions (
  room_id uuid references public.rooms(id) on delete cascade,
  actor uuid references auth.users(id) on delete cascade,
  transaction_id xid8 not null,
  primary key(room_id,actor)
);
alter table room_pin.config enable row level security;
alter table room_pin.locks enable row level security;
alter table room_pin.attempts enable row level security;
alter table room_pin.budget enable row level security;
alter table room_pin.admissions enable row level security;
revoke all on all tables in schema room_pin from public,anon,authenticated,service_role;

alter table public.rooms add column access_locked boolean not null default false;

create function room_pin.sync_flag() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  new.access_locked:=exists(select 1 from room_pin.locks where room_id=new.id);
  return new;
end $$;
create trigger room_pin_sync_flag before insert or update of access_locked on public.rooms
for each row execute function room_pin.sync_flag();

create function room_pin.require_member_admission() returns trigger
language plpgsql security definer set search_path='' as $$
declare r public.rooms;
begin
  if tg_op='UPDATE' and (new.room_id,new.user_id) is not distinct from (old.room_id,old.user_id) then
    return new;
  end if;
  select * into strict r from public.rooms where id=new.room_id for share;
  if r.access_locked and r.owner_id<>new.user_id and not exists(
    select 1 from room_pin.admissions x where x.room_id=r.id and x.actor=new.user_id
      and x.transaction_id=pg_current_xact_id_if_assigned()
  ) then raise exception 'ROOM_PIN_REQUIRED' using errcode='42501'; end if;
  return new;
end $$;
create trigger room_pin_guard_members before insert or update of room_id,user_id on public.room_members
for each row execute function room_pin.require_member_admission();

create function room_pin.keyed(p_room uuid,p_pin text) returns text
language sql stable set search_path='' as $$
  select encode(extensions.hmac(convert_to(p_room::text||':'||p_pin,'UTF8'),pepper,'sha256'),'hex')
  from room_pin.config where singleton
$$;

create function public.totichat_room_set_pin(p_room_id uuid,p_pin text) returns boolean
language plpgsql security definer set search_path='' as $$
declare actor uuid:=toti_practice_games.player(); r public.rooms;
begin
  select * into r from public.rooms where id=p_room_id for update;
  if not found or r.owner_id<>actor then raise exception 'ROOM_PIN_OWNER_REQUIRED' using errcode='42501'; end if;
  if p_pin is null then
    delete from room_pin.locks where room_id=r.id;
  else
    if p_pin !~ '^[0-9]{6}$' then raise exception 'ROOM_PIN_FORMAT' using errcode='22023'; end if;
    insert into room_pin.locks values(r.id,extensions.crypt(room_pin.keyed(r.id,p_pin),extensions.gen_salt('bf',8)))
    on conflict(room_id) do update set digest=excluded.digest;
  end if;
  update public.rooms set access_locked=(p_pin is not null) where id=r.id;
  return p_pin is not null;
end $$;

create function public.totichat_room_enter_with_pin(p_room_id uuid,p_pin text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor_id uuid:=toti_practice_games.player();
  r public.rooms;
  entry room_pin.attempts;
  usage room_pin.budget;
  hashed text;
  at_time timestamptz;
begin
  select * into strict r from public.rooms where id=p_room_id for share;
  if not r.access_locked or r.owner_id=actor_id then
    perform phase3.phase2_room_join(r.id);
    return jsonb_build_object('status','joined');
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{6}$' then raise exception 'ROOM_PIN_FORMAT' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended('room-pin:'||r.id::text,0));
  at_time:=clock_timestamp();
  select * into entry from room_pin.attempts where room_id=r.id and actor=actor_id;
  if entry.retry_at>at_time then
    return jsonb_build_object('status','wait','seconds',ceil(extract(epoch from entry.retry_at-at_time)));
  end if;
  select * into usage from room_pin.budget where room_id=r.id;
  if usage.window_start+interval '1 minute'>at_time and usage.hits>=30 then
    return jsonb_build_object('status','wait','seconds',ceil(extract(epoch from usage.window_start+interval '1 minute'-at_time)));
  end if;
  insert into room_pin.budget values(r.id,at_time,1)
  on conflict(room_id) do update set
    window_start=case when room_pin.budget.window_start+interval '1 minute'<=at_time then at_time else room_pin.budget.window_start end,
    hits=case when room_pin.budget.window_start+interval '1 minute'<=at_time then 1 else room_pin.budget.hits+1 end;
  select digest into strict hashed from room_pin.locks where room_id=r.id;
  if extensions.crypt(room_pin.keyed(r.id,p_pin),hashed)<>hashed then
    insert into room_pin.attempts values(r.id,actor_id,1,null,at_time)
    on conflict(room_id,actor) do update set failures=case
      when room_pin.attempts.retry_at is not null or room_pin.attempts.last_attempt<at_time-interval '1 day' then 1
      else room_pin.attempts.failures+1 end,
      retry_at=case when room_pin.attempts.retry_at is null and room_pin.attempts.last_attempt>=at_time-interval '1 day'
        and room_pin.attempts.failures>=4 then at_time+interval '1 minute' end,
      last_attempt=at_time
    returning * into entry;
    return jsonb_build_object('status','wrong','seconds',case when entry.retry_at is not null then 60 else 0 end);
  end if;
  insert into room_pin.admissions values(r.id,actor_id,pg_current_xact_id());
  perform phase3.phase2_room_join(r.id);
  delete from room_pin.admissions where room_id=r.id and actor=actor_id;
  delete from room_pin.attempts where room_id=r.id and actor=actor_id;
  return jsonb_build_object('status','joined');
end $$;

revoke execute on all functions in schema room_pin from public,anon,authenticated,service_role;
revoke execute on function public.totichat_room_set_pin(uuid,text),public.totichat_room_enter_with_pin(uuid,text) from public,anon;
grant execute on function public.totichat_room_set_pin(uuid,text),public.totichat_room_enter_with_pin(uuid,text) to authenticated;
select cron.schedule('totichat-room-pin-attempt-cleanup','19 2 * * *',
  'delete from room_pin.attempts where last_attempt < now() - interval ''2 days''');

CREATE OR REPLACE FUNCTION phase3.phase2_room_join(p_room_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller uuid;
  r public.rooms%rowtype;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
  caller := phase3.actor();
  if caller is null then raise exception 'not authenticated'; end if;
  select * into r from public.rooms where id = p_room_id for share;
  if not found then raise exception 'room does not exist'; end if;
  if r.access_locked and r.owner_id<>caller and not exists(
    select 1 from room_pin.admissions where room_id=r.id and actor=caller
      and transaction_id=pg_current_xact_id_if_assigned()
  ) then raise exception 'ROOM_PIN_REQUIRED' using errcode='42501'; end if;
  if r.is_private and r.owner_id <> caller then
    if phase3.active_room_vip_tier(caller) <> 12 then
      raise exception 'room is private';
    end if;
    if not phase3.vip_closed_room_allowed(caller,r.id,r.owner_id) then
      if exists (select 1 from public.room_bans b
        where b.room_id=r.id and b.user_id=caller and (b.expires_at is null or b.expires_at>now())) then
        raise exception 'ROOM_BANNED' using errcode='42501';
      end if;
      raise exception 'ROOM_ACCESS_DENIED' using errcode='42501';
    end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  if exists(select 1 from public.room_members where room_id = p_room_id and user_id = caller) then
    return true;
  end if;
  delete from public.room_members where user_id = caller and room_id <> p_room_id;
  insert into public.room_members(room_id,user_id) values(p_room_id,caller);
  return true;
end;
$function$;

create or replace function phase3.shared_room_info(p_room uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',r.id,'public_id',r.public_id,'title',r.title,'access_locked',r.access_locked,'cover_path',r.cover_path,
    'background_path',r.background_path,'owner_id',r.owner_id,'owner_name',p.display_name,'owner_avatar',p.avatar_url,
    'is_private',r.is_private,'welcome_message',r.welcome_message,'tag',r.tag,
    'members',(select count(*) from public.room_members m where m.room_id=r.id))
  from public.rooms r left join public.profiles p on p.id=r.owner_id
  where r.id=p_room and auth.uid() is not null and public.otp_access_allowed()
  and (not r.is_private or r.owner_id=auth.uid() or exists(
    select 1 from public.room_members m where m.room_id=r.id and m.user_id=auth.uid()
  ))
$$;

create or replace function phase3.directory_search(p_kind text,p_query text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 viewer uuid := auth.uid();
 query text := phase3.directory_search_text(p_query);
 pattern text;
 numeric_id bigint;
 output jsonb;
begin
 if viewer is null or not public.otp_access_allowed() then
   raise exception 'SEARCH_AUTH_REQUIRED' using errcode='42501';
 end if;
 if p_kind is null or p_kind not in ('users','rooms') then raise exception 'SEARCH_KIND_INVALID'; end if;
 if query is null or (length(query) < 2 and query !~ '^[0-9]$') or length(query) > 80 then return '[]'::jsonb; end if;
 if query ~ '^[0-9]{1,15}$' then numeric_id := query::bigint; end if;
 -- Treat punctuation and wildcard characters in names as literal text.
 pattern := '%' || replace(replace(replace(query,chr(92),chr(92)||chr(92)),'%',chr(92)||'%'),'_',chr(92)||'_') || '%';

 if p_kind='users' then
   with matches as (
     select p.id,2 as priority from public.profiles p
       where phase3.directory_search_text(p.display_name) like pattern
     union all
     select p.id,1 from public.profiles p where p.public_id=numeric_id
     union all
     select s.user_id,0 from public.account_special_ids s where s.public_id=query
   ), candidates as materialized (
     select p.*,m.priority from (select id,min(priority) priority from matches group by id) m
     join public.profiles p on p.id=m.id
     join auth.users a on a.id=p.id
     where a.deleted_at is null and not coalesce(a.is_anonymous,false)
       and a.email_confirmed_at is not null and (a.banned_until is null or a.banned_until<=now())
       and (numeric_id is null or m.priority=0 or not exists (select 1 from matches x where x.priority=0))
     order by m.priority,p.display_name,p.id limit 20
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'gender',p.gender,
     'public_id',coalesce(s.public_id,p.public_id::text),
     'badge',case when exists(select 1 from phase3.system_authority a where a.owner_id=p.id)
       or exists(select 1 from phase3.admin_access a where a.user_id=p.id and a.role in ('owner','admin','super_admin'))
       then 'admin' when s.public_id is not null then 'special' else 'normal' end,
     'vip',coalesce(v.tier,0),'wealth',public.staging_royal_level_for_xp(x.wealth),
     'charm',public.staging_royal_level_for_xp(x.charm),
     'frame',public.equipped_public_decoration(p.id,'frames'),
     'royal_track',e.track,'royal_level',e.level
   ) order by p.priority,p.display_name,p.id),'[]') into output
   from candidates p left join public.account_special_ids s on s.user_id=p.id
   left join public.vip_entitlements v on v.user_id=p.id and (v.expires_at is null or v.expires_at>now())
   left join public.royal_equipped_frames e on e.scope='personal' and e.subject_id=p.id
   cross join lateral (
     select (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
             join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id) as wealth,
            (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
             join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id) as charm
   ) x;
 else
   with candidates as materialized (
     select r.*,case when r.public_id=numeric_id then 0 else 1 end as priority
     from public.rooms r
     where (not r.is_private or r.owner_id=viewer or exists (
       select 1 from public.room_members m where m.room_id=r.id and m.user_id=viewer
     )) and (r.public_id=numeric_id or phase3.directory_search_text(r.title) like pattern)
     order by priority,r.title,r.id limit 20
   ), ranking as (
     select g.room_id,rank() over (order by sum(g.amount) desc) as rank
     from public.gift_events g where g.room_id is not null
       and g.created_at>=date_trunc('month',now(),'UTC') and exists(select 1 from candidates)
     group by g.room_id having sum(g.amount)>0
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',r.id,'public_id',r.public_id,'title',r.title,'access_locked',r.access_locked,'owner_id',r.owner_id,'is_private',r.is_private,
     'welcome_message',r.welcome_message,'tag',r.tag,'cover_path',r.cover_path,'background_path',r.background_path,
     'owner_name',p.display_name,'owner_avatar',p.avatar_url,
     'members',(select count(*) from public.room_members m where m.room_id=r.id),
     'level',public.staging_royal_level_for_xp((public.staging_room_royal_xp(r.id)->>'room_lifetime_xp')::bigint),
     'rank',case when k.rank between 1 and 3 then k.rank end
   ) order by r.priority,r.title,r.id),'[]') into output
   from candidates r left join public.profiles p on p.id=r.owner_id
   left join ranking k on k.room_id=r.id;
 end if;
 return output;
end
$$;
