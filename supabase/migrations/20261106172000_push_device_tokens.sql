-- Staging preparation: authenticated users may register only their own push devices.
-- Sending notifications must be performed by a trusted server, never by the client.
create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android' check (platform in ('android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token)
);
create index if not exists push_device_tokens_user_id_idx on public.push_device_tokens (user_id);
alter table public.push_device_tokens enable row level security;
revoke all on public.push_device_tokens from anon;
grant select, insert, update, delete on public.push_device_tokens to authenticated;
drop policy if exists push_device_tokens_select_own on public.push_device_tokens;
create policy push_device_tokens_select_own on public.push_device_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists push_device_tokens_insert_own on public.push_device_tokens;
create policy push_device_tokens_insert_own on public.push_device_tokens
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists push_device_tokens_update_own on public.push_device_tokens;
create policy push_device_tokens_update_own on public.push_device_tokens
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists push_device_tokens_delete_own on public.push_device_tokens;
create policy push_device_tokens_delete_own on public.push_device_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);
