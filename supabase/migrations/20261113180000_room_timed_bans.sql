-- Staging room-ban duration support. Existing rows stay permanent (NULL expiry).
alter table public.room_bans
  add column if not exists expires_at timestamptz,
  add column if not exists ban_version uuid not null default gen_random_uuid();

create index if not exists room_bans_active_room_idx
  on public.room_bans(room_id, user_id, expires_at);

create table if not exists phase3.room_timed_moderation_requests (
  actor_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);
alter table phase3.room_timed_moderation_requests enable row level security;
revoke all on phase3.room_timed_moderation_requests from public, anon, authenticated;
drop policy if exists room_timed_moderation_requests_no_client_access on phase3.room_timed_moderation_requests;
create policy room_timed_moderation_requests_no_client_access
  on phase3.room_timed_moderation_requests for all to public
  using (false) with check (false);

create or replace function public.phase2_room_moderate_voice_relay_v2(
  p_verified_user_claims jsonb,
  p_room_id uuid,
  p_target uuid,
  p_action text,
  p_request_id uuid,
  p_reason text default null,
  p_duration_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  original_role text := auth.jwt()->>'role';
  caller_id uuid;
  room_owner uuid;
  existing_ban public.room_bans%rowtype;
  prior phase3.room_timed_moderation_requests%rowtype;
  legacy_prior phase3.room_moderation_requests%rowtype;
  payload jsonb;
  result jsonb;
  expires_at_value timestamptz;
begin
  if original_role is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode='42501';
  end if;
  if p_verified_user_claims is null
    or p_verified_user_claims->>'role' is distinct from 'authenticated'
    or coalesce(p_verified_user_claims->>'sub','') !~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or coalesce(p_verified_user_claims->>'session_id','') !~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or p_room_id is null or p_target is null or p_request_id is null
    or p_action is null or p_action not in ('ban','unban')
    or char_length(btrim(coalesce(p_reason,''))) not between 5 and 300 then
    raise exception 'INVALID_ROOM_BAN_REQUEST' using errcode='42501';
  end if;
  if (p_action='unban' and p_duration_seconds is not null)
    or (p_action='ban' and p_duration_seconds is not null and
       p_duration_seconds not in (600,1800,3600,21600,43200,86400,259200,604800,2592000)) then
    raise exception 'INVALID_ROOM_BAN_DURATION' using errcode='22023';
  end if;

  perform pg_catalog.set_config('request.jwt.claims',p_verified_user_claims::text,true);
  caller_id := phase3.actor();

  select r.owner_id into room_owner
  from public.rooms r where r.id=p_room_id for update;
  if not found then raise exception 'Room unavailable' using errcode='42501'; end if;
  if caller_id is distinct from room_owner and not exists (
    select 1 from public.room_moderators m
    where m.room_id=p_room_id and m.user_id=caller_id
  ) then
    raise exception 'Room moderator permission required' using errcode='42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    hashtextextended(caller_id::text || p_request_id::text,0)
  );
  payload := jsonb_build_object(
    'room',p_room_id,'target',p_target,'action',p_action,
    'reason',btrim(p_reason),'durationSeconds',p_duration_seconds
  );
  select * into prior from phase3.room_timed_moderation_requests
    where actor_id=caller_id and request_id=p_request_id;
  if found then
    if prior.payload<>payload then raise exception 'Idempotency key conflict'; end if;
    return prior.result;
  end if;

  -- Do not reinterpret a pre-upgrade request ID whose stored payload lacked duration.
  select * into legacy_prior from phase3.room_moderation_requests
    where actor_id=caller_id and request_id=p_request_id;
  if found then raise exception 'Legacy request ID cannot be reused'; end if;

  select * into existing_ban from public.room_bans
    where room_id=p_room_id and user_id=p_target for update;
  if p_action='ban' and found and caller_id<>room_owner
     and existing_ban.expires_at is null and existing_ban.banned_by=room_owner then
    raise exception 'Only room owner can replace the owner ban' using errcode='42501';
  end if;
  if p_action='ban' and found and caller_id<>room_owner
     and existing_ban.expires_at is not null and existing_ban.expires_at>now()
     and existing_ban.banned_by<>caller_id then
    raise exception 'Moderator may replace only their own active ban' using errcode='42501';
  end if;
  if p_action='unban' then
    if not found then raise exception 'Ban record does not exist'; end if;
    if caller_id<>room_owner and existing_ban.banned_by<>caller_id then
      raise exception 'Moderator may lift only their own ban' using errcode='42501';
    end if;
  end if;

  result := phase3.room_moderation_action(
    p_room_id,p_target,p_action,p_request_id,btrim(p_reason)
  );

  if p_action='ban' then
    expires_at_value := case
      when p_duration_seconds is null then null
      else now() + make_interval(secs => p_duration_seconds)
    end;
    update public.room_bans
      set banned_by=caller_id,
          reason=btrim(p_reason),
          created_at=now(),
          expires_at=expires_at_value,
          ban_version=gen_random_uuid()
      where room_id=p_room_id and user_id=p_target;
    if not found then raise exception 'Ban write was not confirmed'; end if;
    result := result || jsonb_build_object('expiresAt',expires_at_value,
      'durationSeconds',p_duration_seconds,'scope','room_only');
    insert into public.security_audit(actor_id,action,details)
      values(caller_id,'room_ban_duration',jsonb_build_object(
        'roomId',p_room_id,'targetId',p_target,'requestId',p_request_id,
        'durationSeconds',p_duration_seconds,'expiresAt',expires_at_value
      ));
  else
    result := result || jsonb_build_object('expiresAt',null,'scope','room_only');
  end if;

  insert into phase3.room_timed_moderation_requests(actor_id,request_id,payload,result)
    values(caller_id,p_request_id,payload,result);
  return result;
end
$function$;
revoke all on function public.phase2_room_moderate_voice_relay_v2(jsonb,uuid,uuid,text,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.phase2_room_moderate_voice_relay_v2(jsonb,uuid,uuid,text,uuid,text,integer) to service_role;

create or replace function phase3.reject_banned_room_join()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if exists(
    select 1 from public.room_bans b
    where b.room_id=new.room_id and b.user_id=new.user_id
      and (b.expires_at is null or b.expires_at>now())
  ) then
    raise exception 'ROOM_BANNED' using errcode='42501';
  end if;
  if exists(
    select 1 from public.room_mutes m
    where m.room_id=new.room_id and m.user_id=new.user_id
  ) then
    new.moderation_muted:=true;
    new.is_muted:=true;
  end if;
  return new;
end
$function$;

-- A moderator can lift only a ban they issued; the room owner can lift any ban.
do $patch$
declare definition text; patched text;
begin
  definition := pg_get_functiondef(
    'phase3.room_moderation_action(uuid,uuid,text,uuid,text)'::regprocedure
  );
  patched := replace(
    definition,
    $old$if not owner_action and p_action='unban' and exists(select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=p_target and b.banned_by=owner) then raise exception 'Only owner can remove owner ban' using errcode='42501'; end if;$old$,
    $new$if not owner_action and p_action='unban' and exists(select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=p_target and b.banned_by<>caller) then raise exception 'Moderator may lift only their own ban' using errcode='42501'; end if;$new$
  );
  if patched = definition then
    raise exception 'Could not safely locate the room unban authorization guard';
  end if;
  execute patched;
end
$patch$;

-- Platform staff room bans stay permanent even when replacing a previous timed ban.
do $patch$
declare definition text; patched text;
begin
  definition := pg_get_functiondef(
    'phase3.admin_room_moderation_action(uuid,uuid,text,text,uuid)'::regprocedure
  );
  patched := replace(
    definition,
    $old$on conflict(room_id,user_id) do update set
   banned_by=excluded.banned_by,reason=excluded.reason,created_at=now();$old$,
    $new$on conflict(room_id,user_id) do update set
   banned_by=excluded.banned_by,reason=excluded.reason,created_at=now(),
   expires_at=null,ban_version=gen_random_uuid();$new$
  );
  if patched = definition then
    raise exception 'Could not safely locate the platform room-ban upsert';
  end if;
  execute patched;
end
$patch$;

create or replace function public.totichat_blocked_profiles(p_room_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare actor uuid := auth.uid(); personal jsonb; room_list jsonb := '[]'::jsonb;
begin
  if actor is null or not public.otp_access_allowed() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'userId',p.id,'name',p.display_name,'publicId',p.public_id,'avatar',p.avatar_url
  ) order by b.created_at desc),'[]'::jsonb)
  into personal
  from (
    select blocked_id,created_at from public.dm_blocks
    where blocker_id=actor order by created_at desc limit 100
  ) b join public.profiles p on p.id=b.blocked_id;

  if p_room_id is not null then
    if not exists(select 1 from public.rooms r where r.id=p_room_id and r.owner_id=actor)
       and not exists(select 1 from public.room_moderators m where m.room_id=p_room_id and m.user_id=actor) then
      raise exception 'ROOM_MODERATOR_REQUIRED' using errcode='42501';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
      'userId',p.id,'name',p.display_name,'publicId',p.public_id,'avatar',p.avatar_url,
      'reason',b.reason,'bannedByOwner',r.owner_id=b.banned_by,'expiresAt',b.expires_at
    ) order by b.created_at desc),'[]'::jsonb)
    into room_list
    from (
      select room_id,user_id,reason,banned_by,created_at,expires_at
      from public.room_bans
      where room_id=p_room_id and (expires_at is null or expires_at>now())
      order by created_at desc limit 100
    ) b
    join public.profiles p on p.id=b.user_id
    join public.rooms r on r.id=b.room_id;
  end if;
  return jsonb_build_object('personal',personal,'room',room_list);
end
$function$;
revoke all on function public.totichat_blocked_profiles(uuid) from public, anon;
grant execute on function public.totichat_blocked_profiles(uuid) to authenticated;
