# TotiChat — Section 27: final acceptance gates

**Branch:** `integration/legacy-backend-staging`. This is a checklist, not a claim that testing has passed.

## Before any Android build
- [ ] Obtain a **separate explicit owner approval** for building an APK.
- [ ] Confirm only the permitted Staging branch is checked out.
- [ ] Inspect changed files for unintended voice, LiveKit, microphone, music, Android signing, packaging, and Production changes.
- [ ] Confirm actual TypeScript check result (not merely that the workflow exists).
- [ ] Confirm the Staging publishable key and environment are selected without exposing secrets.

## Existing CI workflow facts
- `.github/workflows/staging-apk.yml` and `.github/workflows/staging-verify.yml` are manual `workflow_dispatch` APK workflows.
- `.github/workflows/staging-typecheck.yml` runs `npm run lint` on Staging pushes, without APK packaging.
- `npm run lint` maps to `tsc --noEmit` in `package.json`.
- `staging-verify.yml` regenerates an Android project inside CI and performs additional configuration steps; do **not** alter this packaging flow under a visual-only task.

## After an authorized APK build
- [ ] APK artifact can be downloaded, ZIP extracted on Android, and APK installed.
- [ ] Google sign-in, OTP, first-time onboarding, and existing-account profile editing work.
- [ ] Voice, mic mute/unmute, speaker indicators, and music still work with no regression.
- [ ] Room entry, minimize/restore, exit, seat locking, and moderator actions work.
- [ ] Owner and other staff roles see only allowed admin UI; server rejects unauthorized actions.
- [ ] Gift banner, VIP/CP visuals, follow state, rankings, and profile data reflect actual Staging data.
- [ ] Test narrow/wide phones, long Arabic text, missing images, offline/error states, and touch targets.
- [ ] Record the exact build run, APK artifact, test device, outcomes, and any failures.

## Status
The above checks are **not yet signed off**. No APK was built during this section. The next section (28) must classify each item based on concrete evidence, not assumed success.
