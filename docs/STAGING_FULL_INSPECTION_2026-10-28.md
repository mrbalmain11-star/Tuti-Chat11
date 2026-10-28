# TotiChat Staging — inspection and reform register (2026-10-28)

Scope: `integration/legacy-backend-staging` at baseline `2ba7af07f532a915701976cb3a8dc8759a6458f5`. Do not modify production or delete real user data.

## Verified
- GitHub Actions runs 40576034790 (APK) and 40576034823 (verification) concluded success. This does **not** prove runtime functionality.
- `src/mockData.ts` contains invented accounts, rooms, balances and counts. Trace all imports before removal.
- `src/App.tsx` ErrorBoundary removes `toti_user_v3` and `toti_user_v4` on retry; audit effects before changing.
- `scripts/check-real-backend.mjs` checks several legacy mock/auth patterns.
- `src/context/AppContext.tsx` uses Supabase auth session listeners and explicitly avoids localStorage for privileged balances.
- `.aistudio/artifacts/brain/.../.tempmediaStorage` contains repeated temporary-looking media; verify references before deletion.

## Required follow-up
1. Trace imports and runtime code paths for every mock source; replace only with authenticated backend data and explicit empty/error/loading states.
2. Audit every button/action against backend authorization, error handling and persistence.
3. Test profile name/avatar update and re-login; validate public display IDs separately from auth UUIDs.
4. Check room uniqueness, 15 seats, reconnect/minimize, mic latency, chat, gifts, CP, agency and admin role enforcement.
5. Review Android permissions, OAuth redirect, signing, install/update compatibility and APK artifact.
6. Run TypeScript, staging backend guard, build, security checks, and real-device smoke tests.
7. Clean generated artifacts only after confirming no runtime references. Preserve source assets, migrations and data.
8. Record evidence per fix and keep main/production untouched.

Status: initial static inspection only; no runtime/device tests or cleanup completed.
