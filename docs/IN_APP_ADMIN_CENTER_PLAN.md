# TotiChat in-app Admin Center — Staging implementation plan

Status: foundation audit in progress. No production or main changes.

## Non-negotiable
- Admin Center is **inside the mobile app only**; no separate web dashboard.
- Preserve all existing user-facing UI. New admin screens are separate and visible only to authorized users.
- Never trust local state, user_metadata, or client-side role toggles for permissions.
- No mock counters, fake success messages, or sample financial records.
- Server checks, RLS, immutable audit events, and explicit permissions are required for every mutation.

## Existing Staging findings
- `phase3.admin_access` exists with `user_id, role, permissions, assigned_by, updated_at`; currently no assigned records.
- `public.agencies` has a unique six-digit `public_id` (Staging migration), and currently zero agency rows.
- Agency modal previously allowed client-side role switching; blocked pending real authorization.
- Agency modal still contains static earnings/counters and other local-only actions; these must be audited before enabling agency management.
- Current mobile project is React/TypeScript/Capacitor; do not silently migrate framework.

## Delivery gates
1. **Identity & permissions:** verify Owner identity through trusted account administration, provision access explicitly, implement read-only self-access endpoint and permission tests. Do not guess Owner UUID or elevate any account automatically.
2. **Entry point:** show Admin Center entry in Profile only after verified backend access; never infer it from `currentUser` local fields.
3. **Read-only overview:** actual user, room, agency, report counts; show unavailable when unauthorized or query fails.
4. **User/room moderation:** server-enforced scopes, confirmation and audited changes.
5. **Agencies:** real membership, registration approval, six-digit agency IDs, agent/host roles from database only.
6. **Economy:** separate high-trust server operations, atomic wallet ledger, idempotency, audit; no direct client wallet writes.
7. **Release:** tests for unauthorized users, revoked permissions, double-submit, stale sessions; two-device functional testing; staging APK approval and CI verification.

## Permissions model
Owner; Super Admin; Admin; Customer Service; Charging Agent; Host Agent; DB Employee. Each action must be authorized on the server by explicit permission; role labels alone are insufficient.

## Outstanding
- No verified Owner grant yet; therefore admin entry must remain unavailable.
- No completed dashboard screens or tested staging APK yet.
- Audit all `mockData` imports and replace by real backend reads without altering visual design.
