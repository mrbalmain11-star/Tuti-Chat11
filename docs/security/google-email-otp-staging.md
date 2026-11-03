# Google sign-in + email OTP (Staging implementation gate)

Status: **security design prepared; not enabled**. Never use the exposed Resend API key. Rotate it first and store the replacement only as a Supabase Edge Function secret.

## Existing code inspected
- `src/components/AuthScreen.tsx`: Google login calls `signInWithRealGoogle()`; the phone OTP UI is unrelated and must remain disabled.
- `src/services/stagingBackend.ts`: existing native/browser Google OAuth callback and session establishment must remain unchanged.
- `src/context/AppContext.tsx`: the auth-state listener sets `isLoggedIn` immediately when a Supabase session exists (around lines 214-235).
- `src/App.tsx`: `isLoggedIn` alone controls access to the app.
- Supabase Staging project: `rziaedugbdwefbefcxjt`. No changes to production or voice/music functions.

## Critical security requirement
**A client-only OTP modal is insecure.** A Google OAuth session already grants access to Supabase data via existing RLS, regardless of a React screen. Do not ship a modal until the backend blocks all protected operations for sessions lacking a server-verified OTP claim or equivalent server-enforced state. Existing Google sessions and refresh tokens need a defined migration/revocation policy; otherwise users may bypass OTP. Test every exposed table, RPC, Storage policy and Edge Function, including gifts, wallets, agencies, moderation and voice token issuance.

## Planned flow
1. Google OAuth completes; use the verified user ID and verified Google email from the server, never an email supplied by the client.
2. A rate-limited Edge Function creates a 6-digit cryptographically random challenge, stores only a keyed digest, expiry (5 min), attempts (5), cooldown (60 sec), and binds it to user and auth session.
3. Send using Resend from a verified sending domain, with `RESEND_API_KEY` stored in Supabase secrets. Do not log code, token or secret. No email should be sent until sender verification and rotation are complete.
4. Verification function performs atomic one-time challenge consumption, enforces attempts and expiry, and grants server-verifiable authorization for the specific session. Protect against replay and concurrent verification.
5. All protected backend resources enforce the completed second step, not just frontend routing. Consider Supabase-supported MFA / custom access-token hook with a reliable server-controlled assurance state; evaluate refresh/revocation semantics before implementation.
6. React auth context should expose `pending_otp`, `verified`, `error` states; only `verified` renders the application. Do not change the existing Google sign-in mechanism.
7. Test valid/expired/wrong/reused codes, resend limits, concurrent requests, app restart, new login, token refresh, old sessions, offline state, and direct Supabase API access before enabling.

## Deployment constraints
- Staging branch only: `integration/legacy-backend-staging`.
- No APK build until separately approved.
- No secret in GitHub, APK, client bundle, or chat.
- Do not claim OTP is active until real email delivery and server-side bypass tests pass.
