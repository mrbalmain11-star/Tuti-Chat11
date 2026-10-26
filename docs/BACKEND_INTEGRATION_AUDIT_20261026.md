# TotiChat backend integration — staging audit (2026-10-26)

## Non-negotiable constraints
- Approved visual source: this repository `mrbalmain11-star/Tuti-Chat11`. Do not alter layout, colors, typography, assets, or animation.
- Legacy backend source: `QYEM7/TotiChatpro`, branch `rebuild/flutter-v1`, Supabase Staging only.
- Do not modify either repository's `main` branch, production infrastructure, or deploy an APK without explicit approval.
- Never use a simulated success state for authentication, money, gifts, messages, rooms, or moderation.
- Never redirect users to the deprecated purple frontend. OAuth redirect must return to the approved app origin, verified against the Supabase Staging allowlist.

## Verified source audit (read-only, not runtime tests)
| Feature | Current source evidence | Required change | Acceptance |
|---|---|---|---|
| Google login | `src/components/AuthScreen.tsx` uses a 600ms timeout followed by `setIsLoggedIn(true)` | Replace with verified Supabase Google OAuth session and auth-state subscription | Real Google sign-in, callback, refresh, sign-out; no fake success |
| Phone OTP | Auth screen displays simulated OTP delivery/verification | Keep disabled until verified backend provider exists | No fake OTP sent/success |
| Session restore | `src/context/AppContext.tsx` trusts `toti_auth_logged_in` and `toti_user_v6_313` in localStorage | Derive session from Supabase `getSession` and verified auth state; clear legacy flags | Refresh cannot log in from stale local flags |
| Rooms | AppContext falls back to `mockRooms` | Read real rooms via authenticated backend and subscribe to changes | Empty state when no rooms; never seed demo rooms |
| Conversations | AppContext initializes `mockConversations` | Query authorized DM threads/messages | No demo threads |
| Agencies | AppContext initializes `mockAgencies` | Server-authorized agency queries | No demo agencies |
| Gifts | `mockGifts` imported; local state in gift store | Real catalog, server-side financial RPC, idempotency, balance check | No optimistic financial success without committed server transaction |
| Wallet | Transactions persisted in localStorage | Server ledger as source of truth | Concurrent/retry tests and cross-device verification |
| Voice | VoiceRoomModal visual component present | LiveKit token + real two-device mic/seat/moderation test | Verified audio across two physical devices |
| Admin | UI components present | Enforce server-side RBAC/RLS | Unauthorized users cannot perform admin actions |

## Integration order
1. Lock frontend baseline and audit all entry points, service calls, storage keys and redirects.
2. Read legacy Supabase migrations, Edge Functions and RLS; map schemas and RPC signatures. No schema guesses.
3. Implement a single Staging-only client configuration and real Google OAuth callback/session gate, preserving the approved login visual.
4. Replace mocks with real authorized reads and loading/empty/error states; no fallback to demo data.
5. Implement write paths (room, DM, gifts, wallet, moderation) with server authorization and explicit failures.
6. Run lint/typecheck/build, integration tests, two-device voice and finance acceptance; document evidence before release.

## Current status
- GitHub write access confirmed by creating `integration/legacy-backend-staging`.
- This document is a source audit and implementation checklist, **not** a claim that backend integration or tests are complete.
- Existing legacy readiness file records unverified real-device Google OAuth, two-device audio and financial end-to-end acceptance.
