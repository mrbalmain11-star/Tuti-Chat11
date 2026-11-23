create table public.room_theater_videos (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  video_id text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$')
);

alter table public.room_theater_videos enable row level security;
revoke all on public.room_theater_videos from public, anon, authenticated;
grant select, insert, update on public.room_theater_videos to authenticated;

create policy "View theater videos for visible rooms"
on public.room_theater_videos for select to authenticated
using (exists (select 1 from public.rooms where id = room_id));

create policy "Room owners can add theater videos"
on public.room_theater_videos for insert to authenticated
with check (exists (
  select 1 from public.rooms where id = room_id and owner_id = (select auth.uid())
));

create policy "Room owners can update theater videos"
on public.room_theater_videos for update to authenticated
using (exists (
  select 1 from public.rooms where id = room_id and owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.rooms where id = room_id and owner_id = (select auth.uid())
));
