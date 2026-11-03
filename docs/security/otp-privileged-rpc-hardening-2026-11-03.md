# Staging OTP privileged RPC hardening — 2026-11-03

## Applied and verified
All **31** authenticated-callable, non-OTP `public` SECURITY DEFINER functions now reference `public.otp_access_allowed()`. Coverage verified using `pg_proc.prosrc`: `gated=31, total=31`.

- PL/pgSQL functions: an authorization guard at the first BEGIN raises SQLSTATE 42501 and `OTP_VERIFICATION_REQUIRED` when denied.
- SQL functions: their existing SELECT is wrapped in a derived SELECT filtered by `public.otp_access_allowed()`. These read-only functions return zero rows when denied. This is a fail-closed data gate, not a replacement for existing owner/member ACLs.
- Existing signatures, owner permissions, and logic were preserved; changes applied to **Supabase Staging only**.
- RLS restrictive policies remain on 32 public tables and `storage.objects`.
- Voice, music and moderation Edge Functions each have a JWT-scoped `otp_access_allowed` check before token issuance or privileged operations.

## Important: enforcement is still disabled
The singleton `otp_private.enforcement_settings.enabled` remains `false`. **Do not enable yet**: actual email delivery, OTP start/verify and cross-session negative tests have not passed. Turning it on before mail delivery is proven would lock users out of protected functions and content.

## Remaining activation blockers
1. Verify server secrets/configuration and successful OTP email delivery from `google-email-otp-start`, followed by a successful verify for a real Google login.
2. Run negative/positive tests for every privileged RPC, Storage, RLS, session revocation, and both devices. Some functions outside public or non-SECURITY-DEFINER functions need separate inventory.
3. Check SQL wrappers and existing business logic with actual authenticated test users; syntax compilation alone does not prove end-to-end behavior.
4. Coordinate server flag and `VITE_GOOGLE_EMAIL_OTP_ENFORCED` client flag only after all checks pass. No APK build without owner approval.

## Auditable verification query
```sql
select count(*) filter (where position('otp_access_allowed()' in p.prosrc)>0) as gated,
       count(*) as total
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef
  and has_function_privilege('authenticated',p.oid,'EXECUTE')
  and p.proname not like 'otp_%';
```
