-- Equip only earned royal frames. No client may mint entitlements.
create table if not exists public.royal_equipped_frames (
  scope text not null check (scope in ('personal','room')),
  subject_id uuid not null,
  track text not null check (track in ('wealth','charm','room')),
  level integer not null check (level between 1 and 200),
  updated_at timestamptz not null default now(),
  primary key(scope,subject_id),
  constraint royal_equipped_scope_track check (
    (scope='personal' and track in ('wealth','charm')) or
    (scope='room' and track='room')
  )
);
alter table public.royal_equipped_frames enable row level security;
revoke all on public.royal_equipped_frames from anon,authenticated;
grant select,insert,update on public.royal_equipped_frames to authenticated;
drop policy if exists royal_equipped_select on public.royal_equipped_frames;
create policy royal_equipped_select on public.royal_equipped_frames
for select to authenticated using (
  (scope='personal' and subject_id=(select auth.uid()))
  or (scope='room' and exists (
    select 1 from public.rooms r where r.id=subject_id and r.owner_id=(select auth.uid())
  ))
);
drop policy if exists royal_equipped_insert on public.royal_equipped_frames;
create policy royal_equipped_insert on public.royal_equipped_frames
for insert to authenticated with check (
  exists (select 1 from public.royal_reward_entitlements e
    where e.subject_id=royal_equipped_frames.subject_id
      and e.track=royal_equipped_frames.track
      and e.level=royal_equipped_frames.level)
  and (
    (scope='personal' and subject_id=(select auth.uid()))
    or (scope='room' and exists (
      select 1 from public.rooms r where r.id=subject_id and r.owner_id=(select auth.uid())
    ))
  )
);
drop policy if exists royal_equipped_update on public.royal_equipped_frames;
create policy royal_equipped_update on public.royal_equipped_frames
for update to authenticated using (
  (scope='personal' and subject_id=(select auth.uid()))
  or (scope='room' and exists (
    select 1 from public.rooms r where r.id=subject_id and r.owner_id=(select auth.uid())
  ))
) with check (
  exists (select 1 from public.royal_reward_entitlements e
    where e.subject_id=royal_equipped_frames.subject_id
      and e.track=royal_equipped_frames.track
      and e.level=royal_equipped_frames.level)
  and (
    (scope='personal' and subject_id=(select auth.uid()))
    or (scope='room' and exists (
      select 1 from public.rooms r where r.id=subject_id and r.owner_id=(select auth.uid())
    ))
  )
);
