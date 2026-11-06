# TotiChat — Visual execution inventory (Staging)

Scope: sections 1–27 of the owner-supplied visual specification. This is a **code-presence audit**, not visual approval or device test. Reference screenshots are not present in this conversation; do not claim pixel fidelity.

## Existing reusable components (verified in branch)

| Requirement | Existing code | Current classification / next gate |
| --- | --- | --- |
| Gift button SVG (5) | `src/components/RoyalGiftIcon.tsx` | Implemented vector; compare with approved reference and test tap on device |
| Create-room SVG (6) | `src/components/RoyalCreateRoomIcon.tsx` | Implemented vector; verify successful creation routes into room |
| Gamepad SVG (11) | `src/components/RoyalGamepadIcon.tsx` | Implemented vector; verify navigation, motion and reduced-motion |
| Follow-room status SVG (17) | `src/components/RoyalRoomFollowIcon.tsx` and `RoomCard.tsx` | Visual exists; verify server persistence and rollback |
| TOP room frame/podium (19) | `src/components/RoyalRoomRankFrame.tsx`, `TopRoomsPodium.tsx` | Visual exists; ranking must be verified as server-authoritative monthly result |
| CP card (4) | `src/components/ProfileCpCard.tsx` | UI and RPC integration present; verify relationship data and authorization |
| Offers and seven-day rewards (7–8) | `src/components/OffersPopup.tsx` | UI and reward RPC present; purchases/admin and claim scenarios need verification |
| Room profile (21) | `src/components/InternalProfileModal.tsx` | Component exists; visual reference comparison and live data check pending |
| VIP labels (3, 15) | `src/components/VipBadge.tsx`, `VipName.tsx` | Presence alone does not establish eight responsive message bubbles or global banners |
| Room moderation/settings | `src/components/RoomManagementPanel.tsx` | Separate functional work; do not modify voice or mic logic |

## Design-only vs backend-sensitive

**Safe visual-only scope:** reusable SVG artwork, gradients, text-safe layouts, RTL alignment, reduced-motion support, responsive sizing, decorative layers that never intercept taps.

**Backend-sensitive scope (do not infer completion from UI):** VIP1–8 entitlement, CP state/end, offers/purchases, daily rewards, special IDs/admin grants, global gift/level/VIP/room-level banners, monthly room ranks, follow persistence, profile changes and moderation. Verify authenticated server source, permissions, and real event triggers before enabling.

## Execution order

1. Inventory current UI and references; preserve existing vector components and stable behavior.
2. Improve SVG-only components and their touch targets without altering click handlers.
3. Address responsive/RTL/reduced-motion and text overflow.
4. Audit backend-dependent visuals and entitlement wiring one feature at a time.
5. Static checks and Android device verification only after separate APK build approval.

## Non-negotiable boundaries

Only `integration/legacy-backend-staging`. No Main/Production, LiveKit, mic, voice, music, Android packaging/signing, financial ledger, or APK builds. Keep every feature in **implemented—needs testing** until verified, and require the approved reference images for visual matching.

## Audit evidence

Inspected on branch: `RoyalGiftIcon.tsx`, `RoyalCreateRoomIcon.tsx`, `RoyalGamepadIcon.tsx`, `RoyalRoomFollowIcon.tsx`, `TopRoomsPodium.tsx`, `RoyalRoomRankFrame.tsx`, `RoomCard.tsx`, `ProfileCpCard.tsx`, `OffersPopup.tsx`. No APK built or device tests performed during this audit.
