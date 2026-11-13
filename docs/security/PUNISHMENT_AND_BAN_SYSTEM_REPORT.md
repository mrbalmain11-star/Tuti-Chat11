# TotiChat Punishment and Ban System Report

**Review date:** 2026-11-13  
**Target:** Supabase Staging `rziaedugbdwefbefcxjt` and branch `integration/legacy-backend-staging`  
**Current branch head:** `ef316df2ee9d0cc02161af3fe8e33705f806f78f`  
**Decision:** Not ready for final acceptance.

## Scope completed in this pass

This pass implemented timed and permanent **room bans** on Staging. It did not implement the complete app-wide punishment system. Existing active ban rows were preserved, and no account, wallet, or balance data was altered.

### Backend changes

- Added nullable `public.room_bans.expires_at`; existing rows with `NULL` remain permanent.
- Added `ban_version` to distinguish renewed bans and a private idempotency table to prevent reusing a request ID with a different user, action, reason, or duration.
- Added `public.phase2_room_moderate_voice_relay_v2`, callable only by `service_role`. It restricts actions to `ban`/`unban`, checks signed session claims through the existing `phase3.actor()` authorization path, and rechecks room ownership/moderator status on every call.
- Allowed durations are server-validated: permanent (`NULL`), 10 minutes, 30 minutes, 1 hour, 6 hours, 12 hours, 24 hours, 3 days, 7 days, and 30 days.
- The room-membership trigger rejects only non-expired bans. The room ban list hides expired rows and includes an active ban's expiry.
- A moderator may lift only a ban they issued; the room owner may lift room bans. Platform staff room bans stay permanent. The existing direct `room_moderation_action` and admin room moderation authorization checks remain server-side.
- The Edge Function passes a duration only for the ban action. Existing kick/mute/release-seat requests still use the existing RPC and LiveKit relay. No audio or music engine implementation was edited.

### Client change

The room moderation UI asks for a supported ban duration and reason, displays an active temporary ban's expiry, and distinguishes temporary and permanent confirmation text. The UI is not an authorization boundary; unsupported durations and unauthorized requests are rejected server-side.

## Evidence

| Check | Result |
|---|---|
| Staging migration application | Success: `room_timed_bans_20261113180000` |
| RPC grants | Pass: `anon=false`, `authenticated=false`, `service_role=true` |
| Authenticated-claims call to privileged relay | Pass: rejected |
| Expiry column and active-ban join predicate | Pass |
| Private request table RLS policy | Present; client access revoked |
| Platform-staff ban expiry behavior | Verified to set `expires_at=NULL` |
| Edge Function | Active, version 10, `verify_jwt=true` |
| GitHub Actions | [Run 43471897167 passed](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43471897167): TypeScript and royal 200-level progression test; no APK build |
| Data protection | No users, balances, or existing room-ban rows deleted or reset |

The first delivery attempt, run [43471030593](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43471030593), failed because an oversized component file was truncated during upload. The whole file was restored and verified by line and character counts before the passing run. The failed run is retained in the record.

## Commits

- Feature commit: `4ef4b6855bc3dc83e1f04a1ad674617ece0f578b` — `feat(security): add timed room bans`.
- Repair commit/current branch head: `ef316df2ee9d0cc02161af3fe8e33705f806f78f` — restores the complete UI source file.

## Test limits and outstanding work

**Room bans — منفذ ويحتاج فحصاً.** Database-level authorization-denial smoke checks passed. There were no isolated identities available for positive owner/moderator tests, revoked-moderator tests, actual expiry waiting, cross-room acceptance, and concurrent requests. The test avoided granting roles to real Staging accounts.

**Complete punishment system — منفذ جزئياً.** Not implemented or verified in this pass:

- App-wide warnings, writing/name/photo/room/invite restrictions, temporary app bans and permanent app bans.
- Duration choices for mutes, and the agreed escalating penalties for repeated behavior.
- Immutable sanction history covering the full lifetime of a ban. Current active room-ban rows are removed on unban; security audit/request records remain, but this is not a complete immutable sanction ledger.
- Room-ban appeal ticket, owner-first review, escalation to TotiChat, app-ban appeals, response timers, and reopen-on-new-evidence.
- Admin punishment/content review centers, searchable case history, and genuine moderation statistics.
- Isolated role fixtures for owner, moderator, member, suspended user, support agent and platform staff.

**Image and identity protection — غير منفذ for image scanning.** Existing text/name filtering remains as previously documented. Direct public image upload, image sexual-content scanning, TotiChat logo similarity, competitor-ad detection, quarantine, manual review and image appeals remain open. No external classifier was selected or enabled.

**Broader security and economy — غير منفذ / منفذ جزئياً.** The current Advisor snapshot still reports 62 informational RLS-without-policy findings, 52 SECURITY DEFINER callable warnings, leaked-password protection warning, 11 unindexed FKs, 80 unused indexes, and one multiple-permissive-policy warning. These need table/function-by-function review; no random revokes were made. Recharge, wallet, gift, XP and concurrency tests remain unverified.

## Final status

Room-ban duration plumbing and the server permission boundary are implemented. Full room-ban behavior still needs isolated positive/negative/revocation/expiry tests. App-wide sanctions, appeals, content moderation, image scanning and the remaining role/economy audits are open. **TotiChat is not ready for final acceptance or publication.**
