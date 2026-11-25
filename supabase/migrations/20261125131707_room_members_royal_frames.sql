create or replace function public.totichat_room_member_directory(p_room_id uuid) returns jsonb
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
      'royalFrame',case when rf.level is null then null else jsonb_build_object('track',rf.track,'level',rf.level) end,
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
    left join public.royal_equipped_frames rf on rf.scope='personal' and rf.subject_id=p.id and rf.track in ('wealth','charm')
    left join public.user_presence pr on pr.user_id=p.id));
end;
$$;
