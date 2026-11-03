# TotiChat — OTP server enforcement acceptance matrix (Staging only)

Status: **NOT ENFORCED — do not enable `VITE_GOOGLE_EMAIL_OTP_ENFORCED` yet.**

## Security invariant
A valid Google OAuth access token is NOT proof that email OTP was completed. Every protected backend entrypoint must reject an unverified **current auth session**; UI-only checks are insufficient. Verification must be bound to `auth.uid()` AND the JWT `session_id` and an active row in `auth.sessions`. Never authorize using client-controlled user metadata.

## Implementation order (no APK build)
1. Inventory exposed public tables, all permissive RLS policies, storage buckets/policies, views, callable SECURITY DEFINER RPCs and Edge Functions. Keep existing owner/row checks intact.
2. Install a service-controlled, default-disabled enforcement switch in a private schema. Only service role can toggle. Do not let authenticated or anon roles modify it.
3. Add **RESTRICTIVE** authenticated policies for protected public tables and storage.objects, using a server-side session verification predicate. Existing permissive policies must still enforce ownership/roles. Check both USING and WITH CHECK for writes; protect INSERT/UPDATE/DELETE and SELECT. Exclude only intentionally public data and explicitly document each exclusion.
4. Gate all authenticated-callable privileged SECURITY DEFINER RPCs and sensitive Edge Functions independently: RLS is bypassed by privileged code. Validate session against auth.sessions for sensitive operations. Do not alter the stable voice engine; secure its authorization boundary instead.
5. Test all cases below with two distinct users and distinct login sessions before switching enforcement on.
6. Only after email delivery works, switch server enforcement and client feature flag in a coordinated Staging rollout; rollback must restore access safely without weakening normal ownership checks.

## Mandatory negative tests
- [ ] Valid Google JWT, OTP not completed: cannot read/write protected profile, wallet, DM, gifts, room data or Storage.
- [ ] Same JWT cannot call privileged recharge, owner, moderation, VIP purchase or gifting RPCs before OTP.
- [ ] Same JWT cannot invoke privileged Edge Functions before OTP.
- [ ] Correct OTP unlocks **only that exact session**; another device/session remains blocked.
- [ ] Revoked session and signed-out user cannot reuse previous OTP verification.
- [ ] Expired OTP, wrong OTP, >5 attempts and resend <60 seconds are rejected server-side.
- [ ] Unauthenticated/anon requests cannot read private OTP challenge or verified session tables.
- [ ] Cross-user access remains blocked after OTP; OTP does not grant admin/owner privileges.
- [ ] Storage upload, update/upsert, download and delete respect existing ownership and OTP gate.
- [ ] Room voice join/reconnect and music still work after verification, without changing audio engine.
- [ ] App restart/refresh does not grant access to an unverified session.
- [ ] Email delivery failure never marks session verified; no OTP code or secret appears in logs.

## Positive tests
- [ ] Verified user can use rooms, DMs, profile, gifts, recharge, VIP and authorized agency flows.
- [ ] Legitimate owner/admin actions work with existing permissions after OTP.
- [ ] Google login, OTP resend, 5-minute expiry, 5 attempts and sign-out UI work on Android.
- [ ] Staging-only rollback tested; Production/main unchanged.

## Release gate
**No user testing described as final, no forced OTP, and no APK build until server authorization coverage is confirmed and the owner authorizes APK build.**