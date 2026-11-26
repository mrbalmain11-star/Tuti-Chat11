begin;

create table phase3.room_chat_mutes (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  muted_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  primary key (room_id,user_id)
);
alter table phase3.room_chat_mutes enable row level security;
revoke all on phase3.room_chat_mutes from public,anon,authenticated;

create function phase3.enforce_room_chat_mute() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.event_kind='chat' and exists(select 1 from phase3.room_chat_mutes m
    where m.room_id=new.room_id and m.user_id=new.sender_id and m.expires_at>now()) then
    raise exception 'ROOM_CHAT_MUTED' using errcode='42501';
  end if;
  return new;
end;
$$;
revoke all on function phase3.enforce_room_chat_mute() from public,anon,authenticated;
create trigger enforce_room_chat_mute before insert on public.room_messages
  for each row execute function phase3.enforce_room_chat_mute();

create function public.totichat_room_set_chat_mute(p_room_id uuid,p_target uuid,p_minutes integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare caller uuid := auth.uid(); owner_id uuid;
begin
  if caller is null or not public.otp_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if p_minutes is null or p_minutes not in (0,5,15,30,60,180,720,1440) then raise exception 'INVALID_CHAT_MUTE_DURATION'; end if;
  select r.owner_id into owner_id from public.rooms r where id=p_room_id for update;
  if owner_id is null or p_target is null or p_target in (owner_id,caller) or (caller <> owner_id and (
    not exists(select 1 from public.room_moderators where room_id=p_room_id and user_id=caller)
    or exists(select 1 from public.room_moderators where room_id=p_room_id and user_id=p_target)
    or exists(select 1 from phase3.room_chat_mutes where room_id=p_room_id and user_id=p_target and muted_by=owner_id and expires_at>now())
  )) then raise exception 'ROOM_MODERATION_REQUIRED' using errcode='42501'; end if;
  if not exists(select 1 from public.room_members where room_id=p_room_id and user_id=p_target) then
    raise exception 'NOT_A_ROOM_MEMBER';
  end if;
  if p_minutes=0 then
    delete from phase3.room_chat_mutes where room_id=p_room_id and user_id=p_target;
    if not found then return true; end if;
  else
    insert into phase3.room_chat_mutes(room_id,user_id,muted_by,expires_at)
      values(p_room_id,p_target,caller,clock_timestamp()+make_interval(mins=>p_minutes))
      on conflict(room_id,user_id) do update set muted_by=excluded.muted_by,expires_at=excluded.expires_at;
  end if;
  insert into public.totichat_room_management_audit(room_id,actor_id,action)
    values(p_room_id,caller,case when p_minutes=0 then 'unmute_chat' else 'mute_chat' end);
  insert into public.security_audit(actor_id,action,details) values(caller,'room_moderation_chat',
    jsonb_build_object('roomId',p_room_id,'targetId',p_target,'minutes',p_minutes));
  return true;
end;
$$;

create function public.totichat_room_member_directory(p_room_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare caller uuid := auth.uid(); owner_id uuid; moderator boolean;
begin
  if caller is null or not public.otp_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  select r.owner_id into owner_id from public.rooms r where r.id=p_room_id;
  if owner_id is null or (caller<>owner_id and not exists(select 1 from public.room_members
      where room_id=p_room_id and user_id=caller)) then raise exception 'NOT_A_ROOM_MEMBER' using errcode='42501'; end if;
  moderator := exists(select 1 from public.room_moderators where room_id=p_room_id and user_id=caller);

  return jsonb_build_object('role',case when caller=owner_id then 'owner' when moderator then 'moderator' else 'member' end,
    'rows', (with ids as (
      select user_id from public.room_members where room_id=p_room_id
      union select user_id from public.room_moderators where room_id=p_room_id
      union select user_id from public.room_bans where room_id=p_room_id and (caller=owner_id or moderator) and (expires_at is null or expires_at>now())
      union select owner_id
    ) select coalesce(jsonb_agg(jsonb_build_object(
      'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'publicId',p.public_id,'specialId',sid.public_id,
      'isMember',m.user_id is not null,'seat',m.seat_no,
      'online',coalesce(pr.last_seen_at>now()-interval '90 seconds',false),
      'role',case when p.id=owner_id then 'owner' when rm.user_id is not null then 'moderator' else 'member' end,
      'vip',coalesce((select max(e.tier) from public.vip_entitlements e
        where e.user_id=p.id and (e.expires_at is null or e.expires_at>now())),0),
      'chatMuted',cm.user_id is not null,'micMuted',vm.user_id is not null,
      'chatMuteByOwner',coalesce(cm.muted_by=owner_id,false),'micMuteByOwner',coalesce(vm.muted_by=owner_id,false),
      'ban',case when b.user_id is null then null else jsonb_build_object('reason',b.reason,'createdAt',b.created_at,
        'expiresAt',b.expires_at,'canLift',caller=owner_id or (moderator and b.banned_by=caller and rm.user_id is null and p.id<>owner_id and p.id<>caller)) end
    ) order by (p.id=owner_id) desc,(rm.user_id is not null) desc,p.display_name,p.id),'[]'::jsonb)
    from ids join public.profiles p on p.id=ids.user_id
    left join public.room_members m on m.room_id=p_room_id and m.user_id=p.id
    left join public.room_moderators rm on rm.room_id=p_room_id and rm.user_id=p.id
    left join public.room_bans b on b.room_id=p_room_id and b.user_id=p.id and (caller=owner_id or moderator) and (b.expires_at is null or b.expires_at>now())
    left join public.room_mutes vm on vm.room_id=p_room_id and vm.user_id=p.id
    left join phase3.room_chat_mutes cm on cm.room_id=p_room_id and cm.user_id=p.id and cm.expires_at>now()
    left join public.account_special_ids sid on sid.user_id=p.id
    left join public.user_presence pr on pr.user_id=p.id));
end;
$$;
revoke all on function public.totichat_room_member_directory(uuid),public.totichat_room_set_chat_mute(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.totichat_room_member_directory(uuid),public.totichat_room_set_chat_mute(uuid,uuid,integer) to authenticated;

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
 if p_action not in ('unban','allow_mic','revoke_moderator') and not exists(select 1 from public.room_members m
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

create or replace function public.totichat_room_management_history(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not public.otp_access_allowed() then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
  if not exists(select 1 from public.rooms where id=p_room_id and owner_id=actor)
    and not exists(select 1 from phase3.my_admin_access()) then raise exception 'OWNER_REQUIRED' using errcode='42501';end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('action',a.action,'actorId',p.public_id,'createdAt',a.created_at)
    order by a.created_at desc),'[]'::jsonb)
  from (
    select actor_id,action,created_at from public.totichat_room_management_audit where room_id=p_room_id
    union all
    select actor_id,action,created_at from public.security_audit
      where details->>'roomId'=p_room_id::text and action in ('room_moderation_warn',
        'room_moderation_grant_moderator','room_moderation_revoke_moderator','room_moderation_mute',
        'room_moderation_allow_mic','room_moderation_release_seat','room_moderation_kick',
        'room_moderation_ban','room_moderation_unban')
    order by created_at desc limit 100
  ) a left join public.profiles p on p.id=a.actor_id);
end;
$$;

commit;
