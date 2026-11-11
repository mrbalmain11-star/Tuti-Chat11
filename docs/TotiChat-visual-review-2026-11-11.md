# TotiChat visual review execution — 2026-11-11

Branch: `integration/legacy-backend-staging`  
Implementation commit: `dfb00050e996082f2fc0cc7d4c1ac9dd110ecc32`  
Supabase target: Staging project `rziaedugbdwefbefcxjt`

## Results

| Area | Status | Result / remaining check |
| --- | --- | --- |
| Verified gift totals | Implemented; pending account/device verification | Wealth and charm totals remain server-derived. Gift event inserts now refresh both sender and recipient totals through authenticated RPCs. |
| In-room and profile level data | Partially implemented; official levels blocked | Removed fallback level 101, level 1 badges, fabricated ages, and misleading level labels. Screens show verified experience totals and explicitly mark the official level unavailable. Staging has no official level fields or complete approved threshold schedule. |
| CP profile card | Implemented; pending device review | The CP RPC returns avatar storage keys, so both profile and partner images now pass through the shared profile-bucket URL resolver. Added image-load fallbacks, two-line Arabic name wrapping, and smaller compact avatars in the room sheet. Existing authenticated CP load/unlink behavior remains unchanged. |
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
- The correction commit was fetched back from GitHub; the changed TypeScript files were UTF-8 checked and both type-check and production build passed on that exact branch head.
- Real gift sender/recipient accounts and Android device screenshots were unavailable in this session; confirm live updates, Arabic wrapping, and small-screen layout on the test phone.
- Do not enable client-derived levels. Add the final level RPC and display only after the owner supplies the approved complete threshold schedule and Staging adds corresponding server-owned fields.

## Excluded from this review

Gift picker visuals and the audio/music engines were excluded by the reference brief. No APK was built as part of this review.
