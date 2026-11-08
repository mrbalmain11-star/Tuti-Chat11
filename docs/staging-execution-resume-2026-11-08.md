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

## Work completed in the continuation batch

| Area | Change | Status |
| --- | --- | --- |
| Group room gifts | Added a server RPC that validates the exact current seated-recipient set (up to 14), gift price/category and quantity, and an idempotency key; serializes against seat changes; delegates each child transfer through the existing checked gift function inside one PostgreSQL transaction, so any failed recipient rolls back the whole batch. Authenticated-only execution, blank search path, and the existing wallet/ledger/audit path are retained. | Implemented on Staging; test-account and concurrency QA pending |
| Group gift UI | Added “send to everyone,” recipient count and total cost preview. It stores an idempotency key per user, room, gift, quantity, and sorted recipient set, reuses that key after an uncertain retry even if the modal or app is reopened, clears it after confirmation, and displays recipient animations only after the server confirms all recipients. | Implemented, needs Android QA |
| Migration corrections | Staging function-definition checks caught an invalid array alias and then an incorrect schema reference before any gift call. Follow-up migrations corrected both. Final remote checks confirm the corrected alias and delegate, `SECURITY DEFINER`, empty search path, authenticated execute, and no anon execute. | Applied and definition/security checked; financial execution not tested |
| Level progression diagnosis | The server EXP RPCs sum historical `gift_events.amount`, while `GIFT_LEVEL_THRESHOLDS` compares that cumulative total against a list whose initial values match the previously specified per-level targets. Treating per-level costs as cumulative thresholds can explain the unusually fast early progression. | Root cause identified as likely; no thresholds or user levels changed because the complete official schedule is still pending |
| Narrow-screen CSS | Removed an invalid, redundant class selector under the 360px media query; shared base styles already set the same font letter-spacing. | Build passes and the CSS selector warning is gone; visual Android QA still pending |
| Login loading states | Made the Google login button show a busy spinner and progress label; made the login surface scroll vertically on short devices; added busy indication to OTP send/resend and removed unused OTP state. Auth calls and Google/OTP flow were not changed. | Implemented, needs Android login QA |
| Profile inventory cleanup | Removed fixed car/frame showcase claims and hardcoded gift names/counts from the public profile. Self profile shows only equipped frame and vehicle values present in the authenticated Supabase inventory; other profiles and gift board show a clear unavailable state until verified data is exposed. | Implemented, needs account/device QA |
| Agency member identities | Replaced the fixed “registered host” label and blank IDs with profile names, avatar URLs, and public account IDs read from Supabase under the existing authenticated profiles policy; removed the fabricated score field. | Implemented, needs agency-account QA |
| VIP storage status | Replaced the fixed VIP 7 card, sample expiry, and invented privilege list with the account's actual VIP level/expiry; show an unavailable notice when no verified privilege catalog is supplied. | Implemented, needs account/device QA |
| Agency metric placeholders | Replaced static host/agency zero salaries, levels, progress, time, commission, and rewards with explicit server-data-unavailable screens; the rewards modal hides fake balances and keeps withdrawal disabled until an audited backend flow exists. | Implemented, needs agency-account QA |
| Diagnostic upload action | Removed the simulated 100% success message; the profile now reports that diagnostic upload is unavailable and confirms no data was sent. | Implemented, needs device QA |
| Invite screen | Removed the client-only 2,500 coin simulation, unverified reward and customer-service claims, fake account-ID fallback, and the matching reward badge in the profile menu. Kept sharing and copy actions using the current account identifier, with unavailable states when it is missing. | Implemented, needs account/device QA |
| Recharge package display | Removed hardcoded coin amounts and prices; active packages now load from the Staging `recharge_packages` table. Direct in-app purchase remains unavailable and does not claim or perform a credit. | Implemented, needs account/device QA |
| VIP purchase safety | Staging `store_catalog` lists active VIP 1–8 at prices different from `staging_purchase_vip`; the RPC also permits VIP 9–12 without active catalog rows. The UI now hides unverified prices/perks and blocks purchases until the catalog and RPC are reconciled. No price or entitlement was changed. | Implemented partially; backend price approval/reconciliation is deferred |

## Remaining work and gates

1. Room presence indicators: seat `isSpeaking` is initialized/reset to `false`, and the current voice adapter does not expose a speaking-state callback; the music player state is local to this client. Do not show either as another user's activity. A real visual speaking indicator needs a view-only LiveKit status bridge that leaves transport, tracks, mic permissions, and audio behavior untouched; defer if that crosses the protected audio boundary.
2. Audit and complete the remaining home/profile icon and responsive screen changes against approved references.
3. Audit Google/Email OTP loading and error states; verify sign-in on Android without changing stable authentication.
4. Level audit: Staging wealth/charm EXP RPCs sum `gift_events.amount`; the client maps that cumulative total using `GIFT_LEVEL_THRESHOLDS` in `src/utils/levelUtils.ts`. Early entries match per-level targets rather than cumulative sums, a likely cause of fast early level-ups. The complete official schedule is still pending. Move level calculation to a server-owned threshold table and correct progression only after the owner supplies the full official schedule; do not change balances or invent thresholds.
5. Test room creation, DM quota (3rd/4th, UTC rollover, mutual follow, block, retry, concurrency), single/group gifts, role boundaries, and all visual changes on test accounts and Android. No financial test gift was sent in this batch.
6. Run final checks after all remaining code changes. Build APK only after separate owner approval.
7. VIP checkout remains blocked: staging `store_catalog` prices for levels 1–8 do not match the `staging_purchase_vip` RPC price case, and levels 9–12 have no active catalog row. Confirm the official price schedule and reconcile the server catalog/RPC before re-enabling checkout.

## Checks already run

- `npm run lint` — passed (`tsc --noEmit`).
- `npm run build` — passed. Existing warnings remain for direct `eval` in `lottie-web`, ineffective dynamic import, and large output chunk. The invalid 360px font selector warning was removed.
- `git diff --check` — passed for the group-gift changes.
- Staging group-gift function definition and grants — confirmed corrected implementation, security-definer mode, empty search path, authenticated execute, and anon denied. No real gift call or wallet mutation was used as a test.
- Staging DM function definition, RLS policies, and execution grants — re-read after migration; confirmed no direct-message RLS policy change and execute remains limited to `authenticated` plus database owner.

## Next step

Continue from the remaining work and gates above; rerun lint/build and `git diff --check` after each coding batch. Changes on this branch must not be described as a completed release until device and backend acceptance gates below are closed. Do not create an APK.
