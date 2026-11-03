# Google email OTP — Staging rollout checklist (2026-11-03)

## Verified work
- Repository: `mrbalmain11-star/Tuti-Chat11`, branch `integration/legacy-backend-staging` only.
- Supabase project: `rziaedugbdwefbefcxjt` (Staging).
- Private tables: `otp_private.email_challenges` and `otp_private.verified_sessions`.
- RLS is enabled; `anon` and `authenticated` cannot SELECT either table.
- Server-only RPCs: `public.otp_issue_challenge`, `public.otp_verify_challenge`, `public.otp_is_verified_for_session`. Checked: ordinary authenticated users have no EXECUTE permission; service_role has EXECUTE.
- `public.otp_session_verified()` is an authenticated-session helper. **It is not yet part of the app's existing RLS policies or privileged RPC entrypoints.**
- Source files committed: `src/services/googleEmailOtp.ts`, `supabase/functions/google-email-otp-start/index.ts`, `supabase/functions/google-email-otp-verify/index.ts`.

## Not yet completed / unsafe to enable
- Edge Function deployment was **blocked by tooling**; do not claim either new function is deployed or sends mail.
- The exposed Resend key must be revoked and replaced. Set the fresh `RESEND_API_KEY` in Supabase Staging function secrets, never in source or chat.
- Also configure independent random `OTP_HMAC_SECRET` (at least 32 characters) and `OTP_FROM_EMAIL` for a verified Resend sender/domain; function fails closed when unavailable.
- Existing Google OAuth marks `isLoggedIn` after the first factor. Existing Data API RLS, Storage, views, Realtime, privileged RPCs, and voice/music token issuance need audited second-factor enforcement before login UI changes.
- Decide how pre-existing Google sessions are handled at activation. A new Google login must have a unique session-specific challenge; refreshing a token should not be treated as a new login.
- No user-facing OTP screen is enabled, no production/main changes, no APK built.

## Required verification before activation
1. Deploy both isolated Edge Functions with valid JWT enforcement and check the actual deployed slugs.
2. Authenticate with Google on a staging test account; obtain code at the verified Google mailbox and confirm 6 digits/5-minute expiry.
3. Wrong, expired, reused, and five-attempt cases must fail; resend must respect 60-second cooldown including parallel requests.
4. Verify `otp_private.verified_sessions` only changes after a correct code, bound to the same `auth.sessions.id`.
5. Prove that unverified but Google-authenticated JWTs cannot bypass OTP via REST, RPC, Storage, or Edge Functions; verify valid-session operations still work.
6. Test app restart, logout/new login, token refresh, multi-device sessions, revoked sessions, and stale old sessions.
7. Only then wire React login gate and build an APK with explicit approval.

> This is additional verification to the Google mailbox, not an independent second factor when the same Google identity controls that mailbox.
