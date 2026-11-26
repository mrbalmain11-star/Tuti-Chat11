-- Read the currently active entitlement from the authoritative subscription table.
create function phase3.active_room_vip_tier(p_user uuid) returns integer
language sql stable set search_path='' as $$
  select coalesce(max(tier),0)::integer from public.vip_entitlements
  where user_id=p_user and tier between 1 and 12 and (expires_at is null or expires_at>now())
$$;
revoke all on function phase3.active_room_vip_tier(uuid) from public,anon,authenticated;

create function phase3.vip_closed_room_allowed(p_user uuid,p_room uuid,p_owner uuid) returns boolean
language sql stable set search_path='' as $$
  select phase3.active_room_vip_tier(p_user)=12 and not exists (
    select 1 from public.dm_blocks b where (b.blocker_id=p_owner and b.blocked_id=p_user)
      or (b.blocker_id=p_user and b.blocked_id=p_owner)
  ) and not exists (
    select 1 from public.room_bans b where b.room_id=p_room and b.user_id=p_user
      and (b.expires_at is null or b.expires_at>now())
  )
$$;
revoke all on function phase3.vip_closed_room_allowed(uuid,uuid,uuid) from public,anon,authenticated;

CREATE OR REPLACE FUNCTION phase3.room_moderation_action(p_room_id uuid, p_target uuid, p_action text, p_request_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 caller uuid:=phase3.actor();
 owner uuid;
 owner_action boolean;
 actor_mod boolean;
 target_mod boolean;
 reason_text text:=btrim(coalesce(p_reason,''));
 payload jsonb;
 previous phase3.room_moderation_requests%rowtype;
 result jsonb;
 target_tier integer;
begin
 if p_room_id is null or p_target is null or p_request_id is null
  or p_action is null or p_action not in
   ('grant_moderator','revoke_moderator','kick','ban','unban','mute','allow_mic','release_seat')
  or octet_length(coalesce(p_reason,''))>1000 then
   raise exception 'Invalid room moderation action';
 end if;
 -- The lock also serializes with the FOR SHARE taken by public/private joins.
 select r.owner_id into owner from public.rooms r where r.id=p_room_id for update;
 if not found then raise exception 'Room unavailable' using errcode='42501';end if;
 owner_action:=owner=caller;
 actor_mod:=exists(select 1 from public.room_moderators m
   where m.room_id=p_room_id and m.user_id=caller);
 if not owner_action and not actor_mod then
  raise exception 'Room moderator permission required' using errcode='42501';
 end if;
 if p_target=owner or p_target=caller then
  raise exception 'Cannot moderate room owner or yourself' using errcode='42501';
 end if;
 target_mod:=exists(select 1 from public.room_moderators m
  where m.room_id=p_room_id and m.user_id=p_target);
 if not owner_action and (target_mod or p_action in
  ('grant_moderator','revoke_moderator')) then
  raise exception 'Owner permission required' using errcode='42501';
 end if;
 if p_action in ('mute','kick') then
  target_tier := phase3.active_room_vip_tier(p_target);
  if p_action='mute' and (target_tier>=10 or (target_tier>=8 and not owner_action)) then
    raise exception 'VIP_ROOM_MUTE_PROTECTED' using errcode='42501';
  end if;
  if p_action='kick' and target_tier>=10 then
    raise exception 'VIP_ROOM_KICK_PROTECTED' using errcode='42501';
  end if;
 end if;
 -- A moderator may neither clear NOR replace an Owner-enforced mute.
 if not owner_action and p_action in ('mute','allow_mic') and exists(
    select 1 from public.room_mutes m where m.room_id=p_room_id
      and m.user_id=p_target and m.muted_by=owner
 ) then raise exception 'Owner mute may be changed only by owner'
   using errcode='42501';end if;
 if not owner_action and p_action='unban' and exists(select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=p_target and b.banned_by<>caller) then raise exception 'Moderator may lift only their own ban' using errcode='42501'; end if;
 if p_action='ban' and char_length(reason_text) not between 5 and 300 then
  raise exception 'Documented ban reason required';
 end if;
 payload:=jsonb_build_object('room',p_room_id,'target',p_target,
   'action',p_action,'reason',reason_text);
 select * into previous from phase3.room_moderation_requests t
  where t.actor_id=caller and t.request_id=p_request_id;
 if found then
  if previous.payload<>payload then raise exception 'Moderation idempotency key conflict';end if;
  return previous.result;
 end if;
 if (select count(*) from phase3.room_moderation_requests t
    where t.actor_id=caller and t.created_at>now()-interval '1 minute')>=30 then
  raise exception 'Moderation rate limit exceeded';
 end if;
 if p_action not in ('unban','allow_mic') and not exists(select 1 from public.room_members m
   where m.room_id=p_room_id and m.user_id=p_target for update) then
  raise exception 'Target is not a room member';
 end if;
 if p_action='grant_moderator' then
  insert into public.room_moderators(room_id,user_id,assigned_by)
   values(p_room_id,p_target,caller) on conflict(room_id,user_id) do nothing;
 elsif p_action='revoke_moderator' then
  delete from public.room_moderators where room_id=p_room_id and user_id=p_target;
 elsif p_action='mute' then
  -- Persist the restriction even if the member voluntarily leaves and rejoins.
  insert into public.room_mutes(room_id,user_id,muted_by)
    values(p_room_id,p_target,caller)
    on conflict(room_id,user_id) do update
    set muted_by=excluded.muted_by,created_at=now();
  update public.room_members set is_muted=true,moderation_muted=true
  where room_id=p_room_id and user_id=p_target;
 elsif p_action='allow_mic' then
  if not owner_action and exists(select 1 from public.room_mutes m
   where m.room_id=p_room_id and m.user_id=p_target and m.muted_by=owner) then
    raise exception 'Owner mute may be released only by owner' using errcode='42501';
  end if;
  delete from public.room_mutes where room_id=p_room_id and user_id=p_target;
  -- Never publish another person's microphone without their own action.
  update public.room_members set is_muted=true,moderation_muted=false
  where room_id=p_room_id and user_id=p_target;
 elsif p_action='release_seat' then
  update public.room_members set is_muted=true,seat_no=null
  where room_id=p_room_id and user_id=p_target;
 elsif p_action='kick' then
  delete from public.room_members where room_id=p_room_id and user_id=p_target;
 elsif p_action='ban' then
  insert into public.room_bans(room_id,user_id,banned_by,reason)
   values(p_room_id,p_target,caller,reason_text)
   on conflict(room_id,user_id) do nothing;
  delete from public.room_members where room_id=p_room_id and user_id=p_target;
 elsif p_action='unban' then
  delete from public.room_bans where room_id=p_room_id and user_id=p_target;
 end if;
 result:=jsonb_build_object('roomId',p_room_id,'targetId',p_target,
  'action',p_action,'success',true);
 insert into phase3.room_moderation_requests(actor_id,request_id,room_id,payload,result)
  values(caller,p_request_id,p_room_id,payload,result);
 insert into public.security_audit(actor_id,action,details)
  values(caller,'room_moderation_'||p_action,
  jsonb_build_object('roomId',p_room_id,'targetId',p_target,
   'requestId',p_request_id,'reason',case when p_action='ban' then reason_text else null end));
 return result;
end $function$;

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

CREATE OR REPLACE FUNCTION phase3.directory_search(p_kind text, p_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
     select r.*,case when r.public_id=numeric_id then 0 else 1 end as priority,
       r.is_private and r.owner_id<>viewer and not exists (
         select 1 from public.room_members m where m.room_id=r.id and m.user_id=viewer
       ) as vip_preview
     from public.rooms r
     where (not r.is_private or r.owner_id=viewer or exists (
       select 1 from public.room_members m where m.room_id=r.id and m.user_id=viewer
     ) or (r.public_id=numeric_id and phase3.vip_closed_room_allowed(viewer,r.id,r.owner_id)))
     and (r.public_id=numeric_id or phase3.directory_search_text(r.title) like pattern)
     order by priority,r.title,r.id limit 20
   ), ranking as (
     select g.room_id,rank() over (order by sum(g.amount) desc) as rank
     from public.gift_events g where g.room_id is not null
       and g.created_at>=date_trunc('month',now(),'UTC') and exists(select 1 from candidates)
     group by g.room_id having sum(g.amount)>0
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',r.id,'public_id',r.public_id,'title',r.title,'owner_id',r.owner_id,'is_private',r.is_private,
     'welcome_message',r.welcome_message,'tag',r.tag,'cover_path',r.cover_path,'background_path',r.background_path,
     'owner_name',p.display_name,'owner_avatar',p.avatar_url,
     'members',case when not r.vip_preview then (select count(*) from public.room_members m where m.room_id=r.id) end,
     'level',case when not r.vip_preview then public.staging_royal_level_for_xp((public.staging_room_royal_xp(r.id)->>'room_lifetime_xp')::bigint) end,
     'rank',case when not r.vip_preview and k.rank between 1 and 3 then k.rank end
   ) order by r.priority,r.title,r.id),'[]') into output
   from candidates r left join public.profiles p on p.id=r.owner_id
   left join ranking k on k.room_id=r.id;
 end if;
 return output;
end
$function$;
