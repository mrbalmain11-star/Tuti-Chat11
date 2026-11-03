# OTP rollout blocker: phase3 RPC surface — 2026-11-03

Live Staging inventory found **93 SECURITY DEFINER functions** in schema `phase3` with `authenticated` EXECUTE privileges and schema USAGE; 89 PL/pgSQL and 4 SQL. This includes gift, recharge, VIP, DM, room, admin, and voice preflight operations.

**Do not turn on `otp_private.enforcement_settings.enabled` yet.** The existing 31 public privileged RPC gates and 32 table RLS gates are not complete coverage of this surface. Also, `phase3.actor` and `phase3.verified_session` are shared helpers invoked through service-role flows, so indiscriminate gate injection could disrupt voice moderation. Check direct PostgREST schema exposure, function call graph and caller JWT context before gating/revoking permissions.

Other blockers: confirm Resend email delivery, real Google session OTP start/verify, negative/positive session tests, and matching client rollout flag. `current_setting('pgrst.db_schemas',true)` returned NULL in the SQL session; this does **not** prove that phase3 is exposed via REST.

Verification queries:
```sql
select n.nspname, l.lanname, count(*)
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
join pg_language l on l.oid=p.prolang
where n.nspname='phase3' and p.prosecdef
and has_function_privilege('authenticated',p.oid,'EXECUTE')
group by n.nspname,l.lanname;
```
No APK or Production changes. Enforcement remains disabled.
