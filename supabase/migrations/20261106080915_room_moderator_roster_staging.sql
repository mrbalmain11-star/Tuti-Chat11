create or replace function public.totichat_room_moderator_ids(p_room_id uuid)
returns uuid[] language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_ids uuid[];
begin
 if v_actor is null or not public.otp_access_allowed() then
   raise exception 'AUTHORIZATION_REQUIRED' using errcode='42501';
 end if;
 if not exists(select 1 from public.room_members where room_id=p_room_id and user_id=v_actor)
   and not exists(select 1 from public.rooms where id=p_room_id and owner_id=v_actor) then
   raise exception 'ROOM_MEMBERSHIP_REQUIRED' using errcode='42501';
 end if;
 select coalesce(array_agg(m.user_id order by m.user_id),'{}'::uuid[]) into v_ids
 from public.room_moderators m where m.room_id=p_room_id;
 return v_ids;
end $$;
revoke all on function public.totichat_room_moderator_ids(uuid) from public,anon;
grant execute on function public.totichat_room_moderator_ids(uuid) to authenticated;
