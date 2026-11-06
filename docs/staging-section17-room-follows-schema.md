# Section 17 — Room-follow Staging schema (applied 2026-11-06)

The following SQL was applied to Supabase **Staging** project `rziaedugbdwefbefcxjt`, not Production. This file is an audit record, **not an unapplied migration**.

```sql
create table if not exists public.room_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id,room_id)
);
create index if not exists room_follows_room_id_idx on public.room_follows(room_id);
alter table public.room_follows enable row level security;
revoke all on public.room_follows from anon,authenticated;
grant select,insert,delete on public.room_follows to authenticated;
drop policy if exists room_follows_select_self on public.room_follows;
create policy room_follows_select_self on public.room_follows for select to authenticated
  using (follower_id = (select auth.uid()) and (select public.otp_access_allowed()));
drop policy if exists room_follows_insert_self on public.room_follows;
create policy room_follows_insert_self on public.room_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and (select public.otp_access_allowed())
    and exists (select 1 from public.rooms r where r.id = room_id and r.owner_id <> (select auth.uid())));
drop policy if exists room_follows_delete_self on public.room_follows;
create policy room_follows_delete_self on public.room_follows for delete to authenticated
  using (follower_id = (select auth.uid()) and (select public.otp_access_allowed()));
```

Verification query confirmed RLS enabled, 3 policies, authenticated SELECT granted and anon SELECT denied.

**Outstanding:** integrate UI, test authenticated insert/delete/read and unauthorized attempts, check Data API exposure, Android QA. Existing `social_follows` remains untouched.
