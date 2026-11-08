# TotiChat — Section 28: implementation and verification inventory

Scope: owner-approved visual specification, sections 1–27, on `integration/legacy-backend-staging`. This is a **GitHub code/commit inventory**, not an APK acceptance report. A commit alone is never proof of successful operation.

Classification:
- **Implemented, pending QA**: code change committed, device/server scenarios not fully tested.
- **Partial**: a subset implemented or a necessary real-data integration is missing.
- **Not verified**: available evidence does not establish completion.
- **Documented**: acceptance rules exist but tests are not yet signed off.

| Section | Requirement | Evidence | Status / missing gate |
| --- | --- | --- | --- |
| 1–2 | Real vector/code implementation, Staging-only scope | `763dd0d` inventory; later UI commits | Partial — reference fidelity and full scope not certified |
| 3 | VIP1–8 chat bubbles | `63a2c93`, `c5b6745`, `0f850ae`, `0d97fc6` | Implemented, pending QA — entitlements, eight levels and devices |
| 4 | Royal CP card and banner | `1195f33`, `eea0a71`, `f8fcf23`, `1af0d84` | Partial — card resized; full banner, data and permissions need verification |
| 5 | Gift icon | `699cb0e` | Implemented, pending QA |
| 6 | Create-room icon | `770291b` | Implemented, pending QA |
| 7 | Offers popup | `a6bef40` | Partial — real purchase/admin flow needs verification |
| 8 | Seven-day reward popup | `bc0c3e4` | Partial — claim schedule and backend validation |
| 9 | Offline/error artwork | `f72ceb4` | Implemented, pending QA |
| 10 | Room minimize/exit UI | `ba88eaa` | Implemented, pending QA — preserve voice on minimize |
| 11 | Gamepad SVG | `a9a89d3` | Implemented, pending QA |
| 12 | Account ID badges | `e4d22c1`, `32f0a6d` | Partial — server-granted rights and all placements |
| 13 | Global gift banner >=7000 | `5c8e93c`, `8c29f13`, `00c1839`, `c8dbebf` | Partial — global feed, image URLs and click-to-room need device verification |
| 14 | User level-up banner | `539e638`, `ae2a9cb` | Implemented, pending QA — real level transition |
| 15 | VIP activation banner | `91835e8`, `2bbfd5c`, `33ad91c` | Implemented, pending QA — real activation |
| 16 | Room level-up banner | `f0cdce8` | **Partial** — presentation component only; no verified server level source or mount |
| 17 | Follow-room icon/state | `194e5e7` | Partial — current server RPC follows room host, not room itself |
| 18 | Seat/lock icons | `04a5b8c`, `a4ca82b` | Implemented, pending QA |
| 19 | Monthly TOP 3 rooms | `b978f65` | Implemented, pending QA — server ranking and layout |
| 20 | Edit profile without OTP | `489eb2a` | Partial — existing editor functional path, visual alignment and device QA |
| 21 | In-room profile card | `9955b39`, `4673831`, `aa9cc32`, `a0a6b70` | Partial — real fallback images, full visual QA pending |
| 22 | Speaking indicator visual | `8fe5fd5` | Implemented, pending QA — no voice engine changes intended |
| 23 | Admin center | `294fe7e`, `0e7ca96`, `f2c40c4`, `8f064a8` | Partial — backend operation authorization and roles not fully audited |
| 24 | Responsive admin layout | `3926d4b`, `70f1919`, `b473f83`, `8987a63`, `4ec94ef` | Partial — admin improvements only; other screens and Android QA remain |
| 25 | Protection boundaries | `4d0bfb5` | Documented — full protected-file diff audit pending |
| 26 | Verification ledger | `4adde1b` | Documented — no confirmed TypeScript or Android test result |
| 27 | Acceptance gates | `04e8f46` | Documented — final acceptance tests not run |

## Remaining blockers before release acceptance

1. Obtain real TypeScript check result and fix any failures without changing protected audio/packaging paths.
2. Verify all backend-sensitive permissions and transitions in Staging (offers, rewards, ID grants, gifts, CP, follow, rankings, admin).
3. Resolve section 16 room-level event source before enabling its banner; do not invent server state.
4. Resolve section 17 host-follow vs room-follow behavior with an explicitly approved server model.
5. Test responsive screens, RTL, long text, image fallback, room lifecycle and stable audio/music on Android.
6. Level progression uses cumulative gift-event amounts against client-side thresholds; early threshold values appear to use per-level costs as cumulative totals, likely explaining rapid early progression. Full official thresholds are still pending, so no values or existing user levels were changed.
7. **Do not build an APK until separate explicit owner approval.**

No requirement in this inventory is marked **complete and verified** without passing test evidence. Games remain deferred under the owner's separate decision.
