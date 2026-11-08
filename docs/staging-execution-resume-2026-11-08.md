# TotiChat Staging execution checkpoint — 2026-11-08

Branch: `integration/legacy-backend-staging`

Starting commit: `042f5bc7742f88a9525893fa6f2183b4c0258fe3`

Scope: code and Staging only. No APK build. Voice/music engines and Android packaging are protected.

## Work completed in this session

| Area | Change | Status |
| --- | --- | --- |
| Room seats and profile | Removed the crown over seat avatars, blue user glyph beside names, fabricated role pill, and zero-level labels. Wealth, charm, and VIP levels now load from the verified profile status RPC before display. | Implemented, needs device and live-data QA |
| Room chat clear state | Replaced the eye glyph on the restore control with the explicit text “إظهار الدردشة”. | Implemented, needs device QA |
| Room profile controls | Kept self mute/leave controls; removed moderator ban/mute/release actions from the public profile card. | Implemented, needs role-based device QA |
| Mic status panel | Removed the duplicate mic icon while retaining the server-backed seat number and mute status. | Implemented, needs device QA |
| Bottom mic controls | Replaced the disabled fake room-volume icon with the real current-user mute toggle in the bottom bar and tools drawer. Both use the existing server-confirmed mute action and disable when the user has no seat. Audio engine and permission code are unchanged. | Implemented, needs device and role QA |
| Direct chat | Added sender avatar, real sender name, and a thin divider under sender identity. | Implemented, needs device QA |
| Room creation | Query the authenticated room list before opening the creation flow; route existing owners into their room; prevent duplicate client requests. Existing server RPC uses a per-owner advisory lock and returns the existing room. | Implemented, needs concurrent/device QA |
| Direct-message policy | Replaced `staging_send_dm` on Staging: mutual follows are unrestricted; otherwise at most three accepted messages per recipient per UTC day. Per-pair advisory locking and nonce idempotency prevent races/retry double-counts. Blocking and OTP checks remain. | Applied to Staging and definition/RLS/execute grants re-read; account and concurrent scenario tests pending |
| Login screen | Removed the phone-login entry point; Google login and current email OTP flow were not changed. | Implemented, needs device QA |
| Gift chooser | Recolored gift cards to the green and gold visual identity and made each selectable gift a keyboard and screen-reader button with its real name and price. Existing server-backed send and debit path is unchanged. | Implemented, needs device QA |
| Profile data display | Removed fixed Iraqi flag and fixed age/gender sample from the profile; show the account's country and age only when present, hide missing game levels, and avoid showing visitor wealth/charm levels until the Staging status RPC returns. | Implemented, needs device and data QA |
| Home category cards | Removed fixed sample profile photos from wealth/charm/room ranking previews. Replaced them with code-drawn rank emblems, consistent green/gold cards, and accessible buttons. | Implemented, needs device QA |
| Leaderboard seed data | Removed 664 lines of unused hardcoded demo accounts, rooms, avatars, and scores. The live leaderboard continues to use the existing `live_rankings` Staging RPC. | Implemented; live ranking/device QA pending |
| Login cleanup | Removed the unreachable legacy phone OTP modal and its dormant SMS handlers; Google login and the separate Google-email OTP screen are unchanged. | Implemented, Google login/device QA pending |

## Remaining work and gates

1. Add an authoritative room-music presence indicator only after a real server-backed status exists; current music playback state is local and must not be represented as another user's activity.
2. Group gift send is not available. Do not fan out separate debits from the client; it needs an atomic, authorized server operation and integration testing. Existing single-recipient gift flow was not changed. Gift chooser visuals are improved, but full group sending and flow acceptance remain open.
3. Audit and complete the remaining home/profile icon and responsive screen changes against approved references.
4. Audit Google/Email OTP loading and error states; verify sign-in on Android without changing stable authentication.
5. Level audit: Staging wealth/charm EXP RPCs sum `gift_events.amount`; the client currently maps that EXP to levels using `GIFT_LEVEL_THRESHOLDS` in `src/utils/levelUtils.ts`. The level mapping is therefore not server-authoritative, and the approved official threshold table is incomplete. Do not change balances or invent higher-level thresholds; server-side mapping and any correction to progression wait for the complete official table.
6. Test room creation, DM quota (3rd/4th, UTC rollover, mutual follow, block, retry, concurrency), gifts, role boundaries, and all visual changes on test accounts and Android.
7. Run final checks after all remaining code changes. Build APK only after separate owner approval.

## Checks already run

- `npm run lint` — passed (`tsc --noEmit`).
- `npm run build` — passed. Existing warnings remain for the font-class CSS selector, direct `eval` in `lottie-web`, ineffective dynamic import, and large output chunk.
- `git diff --check` — passed after the verified-profile RPC edit.
- Staging DM function definition, RLS policies, and execution grants — re-read after migration; confirmed no direct-message RLS policy change and execute remains limited to `authenticated` plus database owner.

## Next step

Continue from the remaining work and gates above; rerun lint/build and `git diff --check` after each coding batch. Changes on this branch must not be described as a completed release until device and backend acceptance gates below are closed. Do not create an APK.
