begin;

create function phase3.room_share_targets() returns jsonb
language sql stable security definer set search_path='' as $$
  with viewer as (select auth.uid() as id where auth.uid() is not null and public.otp_access_allowed()),
  activity as (
    select d.recipient_id as peer,d.created_at from public.direct_messages d join viewer v on d.sender_id=v.id
    union all
    select d.sender_id,d.created_at from public.direct_messages d join viewer v on d.recipient_id=v.id
  ), latest as (
    select peer,max(created_at) as touched from activity group by peer
  )
  select coalesce(jsonb_agg(to_jsonb(t) order by t.touched desc,t.id),'[]'::jsonb) from (
    select p.id,p.display_name,p.avatar_url,p.public_id,s.public_id as special_id,a.touched
    from latest a join public.profiles p on p.id=a.peer cross join viewer v
    left join public.account_special_ids s on s.user_id=p.id
    where p.id<>v.id and not exists (
      select 1 from public.dm_blocks b where (b.blocker_id=v.id and b.blocked_id=p.id)
        or (b.blocker_id=p.id and b.blocked_id=v.id))
    order by a.touched desc,p.id limit 100
  ) t
$$;

create function phase3.shared_room_info(p_room uuid) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('id',r.id,'public_id',r.public_id,'title',r.title,'cover_path',r.cover_path,
    'background_path',r.background_path,'owner_id',r.owner_id,'owner_name',p.display_name,'owner_avatar',p.avatar_url,
    'is_private',r.is_private,'welcome_message',r.welcome_message,'tag',r.tag,
    'members',(select count(*) from public.room_members m where m.room_id=r.id))
  from public.rooms r left join public.profiles p on p.id=r.owner_id
  where r.id=p_room and auth.uid() is not null and public.otp_access_allowed()
  and (not r.is_private or r.owner_id=auth.uid() or exists(
    select 1 from public.room_members m where m.room_id=r.id and m.user_id=auth.uid()
  ))
$$;

create function phase3.room_share_send(p_room uuid,p_to uuid,p_nonce uuid) returns bigint
language plpgsql security definer set search_path='' as $$
declare sender uuid := auth.uid();
  message text;
  previous public.direct_messages%rowtype;
begin
  if sender is null or not public.otp_access_allowed() then raise exception 'SHARE_AUTH_REQUIRED' using errcode='42501'; end if;
  if p_room is null or p_to is null or p_to=sender or p_nonce is null then raise exception 'SHARE_INVALID'; end if;
  message := 'TotiChat · مشاركة غرفة · '||p_room::text;
  perform pg_advisory_xact_lock(hashtextextended('room-share:'||sender::text,0));
  select * into previous from public.direct_messages d where d.sender_id=sender and d.request_id=p_nonce;
  if found then
    if previous.recipient_id<>p_to or previous.body<>message then raise exception 'SHARE_NONCE_CONFLICT'; end if;
    return previous.id;
  end if;
  if not exists (select 1 from public.room_members m where m.room_id=p_room and m.user_id=sender) then
    raise exception 'SHARE_ROOM_MEMBERSHIP_REQUIRED' using errcode='42501';
  end if;
  if not exists (select 1 from public.direct_messages d where
    (d.sender_id=sender and d.recipient_id=p_to) or (d.sender_id=p_to and d.recipient_id=sender)) then
    raise exception 'SHARE_EXISTING_THREAD_REQUIRED' using errcode='42501';
  end if;
  if (select count(*) from public.direct_messages d where d.sender_id=sender
      and starts_with(d.body,'TotiChat · مشاركة غرفة · ') and d.created_at>=now()-interval '1 minute')>=20 then
    raise exception 'SHARE_RATE_LIMIT';
  end if;
  return public.staging_send_dm(p_to,message,p_nonce);
end
$$;

create function public.room_share_targets() returns jsonb language sql stable set search_path='' as $$
  select phase3.room_share_targets()
$$;
create function public.shared_room_info(p_room uuid) returns jsonb language sql stable set search_path='' as $$
  select phase3.shared_room_info(p_room)
$$;
create function public.room_share_send(p_room uuid,p_to uuid,p_nonce uuid) returns bigint language sql set search_path='' as $$
  select phase3.room_share_send(p_room,p_to,p_nonce)
$$;
revoke all on function public.room_share_targets(), public.shared_room_info(uuid), public.room_share_send(uuid,uuid,uuid),
 phase3.room_share_targets(), phase3.shared_room_info(uuid), phase3.room_share_send(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.room_share_targets(), public.shared_room_info(uuid), public.room_share_send(uuid,uuid,uuid),
 phase3.room_share_targets(), phase3.shared_room_info(uuid), phase3.room_share_send(uuid,uuid,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
