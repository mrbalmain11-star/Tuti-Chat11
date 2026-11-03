# OTP RLS gate — applied to Supabase Staging 2026-11-03

**Status: installed, NOT ACTIVATED.** Do not enable until all privileged RPCs and Edge Functions are guarded and mail delivery has been tested.

## Installed server-side
- `otp_private.enforcement_settings`: singleton `id=true`, `enabled=false`; RLS enabled and all grants revoked from anon/authenticated.
- `public.otp_access_allowed()`: STABLE SECURITY DEFINER SQL predicate with empty search_path, executable by authenticated only. When disabled returns true; when enabled requires matching `auth.uid()`, JWT `session_id`, `otp_private.verified_sessions`, and active `auth.sessions`.
- `otp_verified_session_gate`: RESTRICTIVE FOR ALL TO authenticated, USING and WITH CHECK, on **32** public tables that had authenticated policies.
- `otp_verified_session_gate`: RESTRICTIVE FOR ALL TO authenticated, USING and WITH CHECK, on `storage.objects`.
- Existing ownership and role policies are preserved; restrictive policies combine with permissive policies rather than replacing them.

## Verification query result
```
enforcement_enabled = false
protected_public_tables = 32
storage_gates = 1
safe_when_disabled = true
```

## Critical gaps
- Privileged SECURITY DEFINER RPCs can bypass RLS and MUST independently enforce the OTP session gate.
- Sensitive Edge Functions may use service role and bypass RLS; they MUST independently enforce the gate.
- Check exposed views, new tables, public/anon Storage access and realtime subscriptions before activation.
- The server-side enforcement flag and `VITE_GOOGLE_EMAIL_OTP_ENFORCED` client flag MUST be coordinated.
- Test session revocation, multiple devices, delivery errors, expiration, rate limits, and authorized room/voice flows.
- Do not build APK or change Production/main without separate authorization.

## Emergency rollback
Keep `otp_private.enforcement_settings.enabled=false` to bypass OTP-specific restrictions while preserving preexisting RLS authorization. Never disable RLS itself.
