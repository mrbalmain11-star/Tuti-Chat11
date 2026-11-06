-- Server-only idempotency claims for direct-message push notifications.
-- Claims are one-shot; delivery failures must be monitored and reconciled
-- by a future trusted retry worker (not by public client replay).
create table if not exists public.direct_message_push_claims (
  message_id bigint primary key references public.direct_messages(id) on delete cascade,
  claimed_at timestamptz not null default now()
);
alter table public.direct_message_push_claims enable row level security;
revoke all on public.direct_message_push_claims from public, anon, authenticated;
grant select, insert, delete on public.direct_message_push_claims to service_role;
