# TotiChat visual review execution — 2026-11-11

Branch: `integration/legacy-backend-staging`  
Implementation commit: `1ae178ed3a4939718ea531969ce8084ac03583bc`  
Supabase target: Staging project `rziaedugbdwefbefcxjt`

## Results

| Area | Status | Result / remaining check |
| --- | --- | --- |
| Verified gift totals | Implemented; pending account/device verification | Wealth and charm totals remain server-derived. Gift event inserts now refresh both sender and recipient totals through authenticated RPCs. |
| In-room and profile level data | Partially implemented; official levels blocked | Removed fallback level 101, level 1 badges, fabricated ages, and misleading level labels. Screens show verified experience totals and explicitly mark the official level unavailable. Staging has no official level fields or complete approved threshold schedule. |
| CP profile card | Implemented; pending device review | Added image-load fallbacks, two-line Arabic name wrapping, and smaller compact avatars in the room sheet. Existing authenticated CP load/unlink behavior remains unchanged. |
| Profile visuals | Implemented; pending device review | Removed the crown above the avatar, added an avatar fallback, and show only server-verified experience totals and available profile values. |
| TOP 3 room podium | Verified against the required order | Existing ranking remains TOP 1 raised in the center, TOP 2 at right, TOP 3 at left. Empty positions no longer render fake cards or labels. |
| Gift box and audio/music | Preserved | No gift-box code, LiveKit engine, music engine, Android audio configuration, or microphone permission was changed. |

## Backend and access checks

- `public.gift_events` has RLS enabled and participant-only `SELECT` policy for sender or recipient.
- The table was added to `supabase_realtime` on Staging in migration `20261111040053_staging_gift_totals_realtime`.
- The new client subscription is filtered to the signed-in user's sender or recipient UUID and reads totals only through the existing authenticated RPCs.
- No user wallet, gift history, profile, Main branch, or Production project data was changed.

## Verification

- `npm run lint` — passed (`tsc --noEmit`).
- `npm run build` — passed. Existing Vite warnings remain for a large JavaScript chunk, direct `eval` in the bundled `lottie-web`, and an ineffective dynamic import.
- `git diff --check` — passed.
- The Staging publication and migration record were checked after applying the migration.
- Real gift sender/recipient accounts and Android device screenshots were unavailable in this session; confirm live updates, Arabic wrapping, and small-screen layout on the test phone.
- Do not enable client-derived levels. Add the final level RPC and display only after the owner supplies the approved complete threshold schedule and Staging adds corresponding server-owned fields.

## Excluded from this review

Gift picker visuals and the audio/music engines were excluded by the reference brief. No APK was built as part of this review.
