# TotiChat — Staging change protection checklist (section 25)

Scope: `integration/legacy-backend-staging` only. Never merge into `main` or production without explicit owner approval.

## Protected subsystems
- Voice/LiveKit, microphone routing, speaking and music playback: no functional changes for visual tasks.
- Android Gradle, signing, Capacitor packaging, ZIP and artifact layout: keep the previously successful packaging.
- Supabase production: no writes or schema changes. Use Staging only.
- APK: do not trigger `staging-apk.yml` without separate explicit owner approval.

## Verification already present in repository
- `.github/workflows/staging-apk.yml` uses `workflow_dispatch` only (not push).
- `.github/workflows/staging-typecheck.yml` runs `npm run lint` on staging pushes; it does not build APK.
- `package.json` maps `lint` to `tsc --noEmit`.

## Required before marking a feature complete
1. Check actual GitHub diff for unintended protected-file changes.
2. Check TypeScript workflow result, not just the presence of a commit.
3. Verify server authorization for sensitive operations; hiding UI controls is insufficient.
4. Exercise narrow and wide Android layouts, room return/minimize, and data loading/error states.
5. Confirm audio and music still work on device without altering their implementation.
6. Keep features **implemented pending QA** until verified; never infer QA success from a component existing.

This document records guardrails; it does not certify that the above checks have passed.
