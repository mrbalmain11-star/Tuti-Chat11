-- Staging-only: authenticated room participants can read seat lock numbers.
-- Does not expose lock ownership or allow clients to modify locks.
create or replace function public.totichat_room_locked_seats(p_room_id uuid)
returns integer[]
language plpgsql
security definer
set search_path = ''
as $$
declare result integer[];
begin
  if auth.uid() is null or not public.otp_access_allowed() then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) and not exists (
    select 1 from public.rooms r
    where r.id = p_room_id and r.owner_id = auth.uid()
  ) then
    raise exception 'ROOM_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;
  select coalesce(array_agg(l.seat_no order by l.seat_no), '{}'::integer[])
    into result
    from public.room_seat_locks l where l.room_id = p_room_id;
  return result;
end;
$$;
revoke all on function public.totichat_room_locked_seats(uuid) from public, anon;
grant execute on function public.totichat_room_locked_seats(uuid) to authenticated;
