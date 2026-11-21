-- Allow authenticated current room members to receive gift Realtime inserts
-- for the room they joined. Gift creation and wallet changes remain server-only.
-- The existing participant policy and OTP restrictive policy remain in place.
create policy "Room members see gift events in joined rooms"
  on public.gift_events
  for select
  to authenticated
  using (
    room_id is not null
    and (
      room_id in (select phase3.my_joined_room_ids())
      or exists (
        select 1
        from public.rooms r
        where r.id = gift_events.room_id
          and r.owner_id = (select auth.uid())
      )
    )
  );
