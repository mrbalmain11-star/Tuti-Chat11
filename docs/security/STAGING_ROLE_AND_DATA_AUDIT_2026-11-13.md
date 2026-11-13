# TotiChat — Staging authorization and data-integrity audit (2026-11-13)

Scope: Supabase project `rziaedugbdwefbefcxjt`, branch `integration/legacy-backend-staging`. **Not a production security certification.** Read-only evidence queries unless explicitly identified as a remediation.

## Verified permissions

| Actor | Confirmed server-side restriction |
|---|---|
| Room owner | `phase3.room_moderation_action` checks `rooms.owner_id = phase3.actor()` |
| Room moderator | Must exist in `room_moderators` for the same room; cannot grant/revoke moderator or moderate the owner or another moderator; cannot undo owner mute/ban |
| Ordinary member | Does not satisfy owner/moderator check; cannot invoke privileged moderation successfully |
| Platform admin | `phase3.admin_room_moderation_action` checks owner or designated main partner, documents reason, protects privileged accounts, rate-limits and audits |
| Customer support | `phase3.support_handler` checks system owner, designated main partner, or enabled `support_staff`; support writes use `support_action` |
| Anonymous | No direct grants to room moderation, bans, support tables, staff roles, or admin access tables |

Note: These are **static source and grant inspections**, not complete end-to-end impersonation tests for every role. `phase3.actor()` verifies a live confirmed non-anonymous account, valid auth session, MFA assurance when enabled, and OTP gate.

## Live staging counts and integrity

- 35 profiles, 21 rooms, 3 joined room members, 0 moderators, 0 bans, 0 support tickets at audit time.
- No orphaned rooms, profiles, members, moderators, room messages, or bans found.
- No profile/room names matched the limited `test|demo|fake|mock|تجريب|وهمي` scan. This **does not prove** there are no synthetic accounts, demo balances, or mock frontend responses.
- No live moderator/support-ticket records: **their role workflows cannot be certified from existing staging records alone.**
- 559 legitimate-level reward entitlements were present in the earlier progression audit. No invalid equipped entitlements were found.

## Security remediation applied

- Removed public/anon/authenticated EXECUTE privileges from internal trigger functions `public.totichat_cp_message_event()` and `public.totichat_room_audit_moderation()`. Trigger attachments remain unchanged.
- GitHub migration: `20261113194500_staging_trigger_execute_lockdown.sql`.

## Remaining security blockers

1. Supabase security advisor still flags **51 authenticated-callable SECURITY DEFINER functions**. Each must be audited for identity checks, privilege boundaries, RLS bypass, input validation, idempotency, and logging. Do **not** revoke all of them blindly; many are required application APIs.
2. Auth advisor flags leaked-password protection not enabled; check authentication settings and enable if supported by the project's plan and login methods.
3. Run authenticated multi-account integration tests: owner vs moderator vs member vs unrelated account; owner mute/ban persistence; support agent vs regular member; admin vs customer support; rate limiting and replay; private-room visibility; revoked staff rights.
4. Search frontend and seed scripts for synthetic user, coin, VIP, room, gift, and support values. Names-only regex is insufficient.
5. Confirm actual CI/typecheck and Android runtime behavior. No APK was built by this audit.

## Deployment gate

Do not promote to Production until the above blockers are resolved and each privilege scenario has a recorded pass/fail result. Keep audio/music implementation and successful APK packaging unchanged.
