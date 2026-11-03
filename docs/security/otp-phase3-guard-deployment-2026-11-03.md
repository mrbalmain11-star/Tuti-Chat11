# OTP phase3 rollout — 2026-11-03

Applied to Supabase **Staging**: all 93 authenticated-callable SECURITY DEFINER functions in `phase3` now check `public.otp_access_allowed()`. Verified `gated=93,total=93` via `pg_proc.prosrc`.

89 PL/pgSQL functions now reject unverified authenticated sessions with SQLSTATE 42501 / `OTP_VERIFICATION_REQUIRED`. Four SQL functions filter their results on the same check. For `phase3` guards, `auth.role()='service_role'` is exempt to preserve privileged internal calls; never expose service-role credentials to clients. Existing function ACLs still apply.

Together with the previously gated 31 public privileged RPCs, this gives 124 guarded RPCs. The table and Storage restrictive RLS gates remain installed.

**Enforcement remains OFF** (`otp_private.enforcement_settings.enabled=false` verified after deployment). The following have NOT been proven by end-to-end tests: OTP email delivery, Google login OTP verify, non-verified user denial, verified user access, role/service integrations, LiveKit audio and music regression, and client rollout. No APK built. Do not enable mandatory enforcement until those tests pass.

Important: SQL read wrappers return no rows when denied; test client handling. Function definition compilation does not guarantee runtime compatibility.
