# TotiChat Staging — Final Security Execution Report

**Review date:** 2026-11-13 (Asia/Baghdad)  
**Repository:** `mrbalmain11-star/Tuti-Chat11`  
**Branch:** `integration/legacy-backend-staging`  
**Reviewed checkout HEAD:** `4444dd6` (`docs: update visual review verification`)  
**Backend:** Supabase Staging project `rziaedugbdwefbefcxjt`  
**Overall decision:** **غير جاهز للنشر؛ جاهز لمتابعة التدقيق واختبار قبول محدود فقط.**

This report records work and evidence from this execution. It does not claim that the full requested audit is complete. No APK was built. The audio and music engines and all user data were left unchanged. Two pre-existing untracked image files in the checkout were left untouched.

## Progress classification

The requested audit contains 28 numbered work areas. The classifications below describe verified progress, not feature presence in the UI.

| Work area | Current status | Evidence / remaining work |
|---|---|---|
| 4. Repository inventory | منفذ جزئياً | Reviewed branch, source tree, migrations, edge functions, test scripts and targeted mock-data patterns. Full source-by-source trace remains. |
| 5. Database inventory | منفذ جزئياً | Read table metadata, migration list, grants, selected RLS policies and integrity counts. Full policy/function/trigger/storage review remains. |
| 6–11. Roles and authorization | منفذ جزئياً | Reviewed sampled owner/admin/moderation guards and ran three denial assertions. Full role matrix and allow/deny/revoked tests for all roles remain. |
| 12–14. Security and account/storage controls | منفذ جزئياً | Sampled security-definer functions and OTP gates. Full IDOR/replay/rate-limit/session/storage tests and leaked-password setting remain. |
| 15–17. Economy and data integrity | منفذ جزئياً | Zero negative wallets or tested orphan references; existing treasury tests pass. Full gift/XP/replay/concurrency/reconciliation audit remains. |
| 18–19. Functional stability/performance | منفذ جزئياً | TypeScript, treasury unit tests and web production build pass. End-to-end Android and audio tests were not run. |
| 20–22. Authorization and regression tests | منفذ جزئياً | Three staging denial assertions and five local treasury unit tests passed. No isolated per-role fixture exists in the inspected checkout. |
| 23. Previous audit | محجوب بعائق | `docs/security/STAGING_ROLE_AND_DATA_AUDIT_2026-11-13.md` is absent from the inspected branch checkout; its stated previous findings were rechecked where possible. |
| 24–28. Reporting and release gates | منفذ جزئياً | This report created. Acceptance conditions remain open, so release readiness is not asserted. |

No confirmed critical or high-severity exploit was established in the checks below. This is not evidence that none exists.

## Findings and evidence

### Environment and data snapshot

- Supabase reported the project as `ACTIVE_HEALTHY`, PostgreSQL 17.11, region `eu-central-1`.
- Current counts: **35 profiles, 21 rooms, 3 room memberships**; matching the earlier figures supplied in the request.
- Integrity checks returned **0 orphan room memberships, 0 orphan wallets, 0 negative wallets, 0 gift events with an orphan sender, and 0 gift events with an orphan non-null recipient**.
- The database has 3 `phase3.admin_access` rows, 0 `phase3.support_staff` rows, 0 `phase3.support_requests` rows, and 193 `public.security_audit` rows. No account identifiers or message contents were exported.
- Supabase migration and Edge Function inventory completed. Six active functions were listed; deployed OTP and DM push functions use JWT verification. This does not replace code review or runtime endpoint tests.

### Supabase Advisors

| Advisor | Current result | Interpretation |
|---|---|---|
| Security | 62 `rls_enabled_no_policy` INFO findings; 51 authenticated-executable `SECURITY DEFINER` WARN findings; 1 leaked-password protection WARN | No-policy findings include private/internal schemas and do not alone prove exposure. The 51 functions are callable by `authenticated`, not `anon` in the catalog sample, and require per-function authorization proof. Leaked-password protection remains an unresolved Auth configuration item. |
| Performance | 11 unindexed foreign keys, 79 unused indexes, 1 multiple-permissive-policy warning on `room_members` SELECT | Performance findings require query/workload review; unused indexes were not removed. The two room roster SELECT policies are scoped to self or an already-joined room; no policy was changed. |
| Health | 0 findings | Advisor health checks were clean at review time. |

The sampled catalog entries use an empty `search_path`; `anon` had no execute privilege for the sampled definer functions. The reviewed high-impact examples included `manage_recharge_offer` (owner/admin check), owner dashboard/badge RPCs (owner check), room roster RPCs (membership check), OTP helpers, daily rewards and gift RPCs. A complete manual review and adversarial test of all 51 functions is **not complete**.

### Staging authorization assertions

Executed as `authenticated` with a reserved all-zero UUID in a rollback-only transaction. The database rejected:

1. `manage_recharge_offer` — `Admin access required`.
2. `owner_manage_tester_badge` — `Owner access required`.
3. `phase2_room_moderate` — `Verified account required`.

The first two show explicit role enforcement; the third shows the fake, unverified principal cannot reach room moderation. These assertions make no persistent data changes. They do not test valid owners, moderators, revoked roles, or actual support personnel. A preceding draft assertion expected the wrong moderation error text and was rolled back; the corrected assertion passed.

### Local code checks

- `npm run lint` — passed (`tsc --noEmit`).
- `node --test tests/treasury.test.mjs` — **5 passed, 0 failed**.
- `npm run build` — passed. This built the web bundle only, not an APK.
- Build warnings remain: Vite `__dirname` compatibility warning; the main JS chunk is about 2.03 MB minified; a dynamic import of `stagingBackend.ts` is ineffective due to other static imports; RollDown reports `eval` in the third-party `lottie-web` player. These are not release-blocking findings established by this review, but should be triaged.
- Targeted text scan found explicit UI comments indicating real backend data for room membership and rankings; it was not a complete proof that every screen has no hardcoded/demo data.

## Role matrix status

Server-side rules and tests are not sufficiently evidenced to certify any complete role. Current evidence is limited to the functions listed above. All other operations need isolated fixtures and both permitted and denied assertions.

| Role | Current evidence | Required before certification |
|---|---|---|
| App owner | Owner-only RPC guards inspected; no valid-owner test in isolated fixture | Positive/negative tests for protected role assignment, finance, support and room controls |
| Main partner | No isolated fixture evidence | Explicit authority hierarchy and non-escalation tests |
| General manager | No isolated fixture evidence | Role-bound admin action tests and hierarchy checks |
| Administrator | Recharge offer admin guard inspected; denial assertion passed | Valid admin and lower/higher role tests for every admin domain |
| Customer support | No support staff records currently; no tickets available to test | Isolated staff/ticket lifecycle, privacy and revocation tests |
| Agency manager | Not verified in this execution | Assignment and scoped action tests |
| Agent | Not verified in this execution | Recharge scope and balance isolation tests |
| Host | Not verified in this execution | Host actions and revocation tests |
| Room owner | Owner moderation source/UI path inspected only | Server-side allow/deny tests for every room operation |
| Room moderator | RPC denial for unverified principal; source checks moderator refresh | Valid moderator, owner protection, peer/higher-role, and immediate demotion tests |
| Ordinary member | No complete test | Membership, private room, seat lock, ban, gift and IDOR tests |
| Anonymous visitor | Sampled `anon` RPC execution denied | Full anonymous API/RLS/storage matrix |
| Banned/suspended account | Not verified in this execution | Session and every sensitive endpoint denial after suspension |

## Blockers and open work

1. The referenced prior audit file is missing from this branch, so its full evidence and audit trail could not be reconciled.
2. No isolated environment or test identities are available for owner, partner, admin, support, agent, host, moderator, member, banned and anonymous end-to-end cases. Existing Staging contains real application records; the rollback treasury script uses a live owner identity and was intentionally not run against these records.
3. The Supabase tools available in this session expose advisors, SQL and metadata, but not the Auth leaked-password protection setting or the project’s underlying Google OAuth/MFA dashboard configuration. The advisor warning therefore remains open.
4. All 51 authenticated-callable `SECURITY DEFINER` functions still need exhaustive source and authorization review with per-function negative and legitimate-positive tests. The warning is not automatically a vulnerability, but it is not closed by this partial review.
5. End-to-end app/API tests for OTP expiry/replay, private-room BOLA, room owner/moderator demotion, storage ownership, financial concurrency, gift settlement/XP, customer support privacy, and suspended accounts remain outstanding.
6. CI status for this exact HEAD and branch-protection checks were not obtained in this execution.

## Remediation and commit record

No application or database security change was made in this pass: the checked role-denial paths rejected the simulated principal, and no safe, confirmed exploitable defect was established. Removing grants, changing RLS, or altering Auth settings without complete behavior tests would risk breaking authorized flows or staging authentication. No database migration was applied.

This report is the only intended repository change from this pass. Its final commit SHA must be filled after the report is committed. Existing untracked image files are excluded from that commit.

## Release gate

**Decision: not ready for final acceptance or publication.** The current evidence is insufficient to certify the full role matrix, all 51 definer functions, Auth leaked-password protection, storage policies, real financial concurrency, all app workflows, or CI. No APK was built, and stable audio/music code was not changed.
