# TotiChat Staging — Final Security Execution Report

**Review date:** 2026-11-13 (Asia/Baghdad)  
**Repository:** `mrbalmain11-star/Tuti-Chat11`  
**Branch:** `integration/legacy-backend-staging`  
**Local checkout HEAD:** `4444dd6` (`docs: update visual review verification`); this checkout differed from the GitHub Staging branch snapshot reviewed by Actions.  
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
- Direct grants: `anon` has only `SELECT` on `public.home_banners` among public tables; no anonymous table DML was found. `authenticated` has no direct `INSERT`/`UPDATE`/`DELETE` grant on wallets, wallet ledger, financial operations or gift events.
- Storage metadata and policies reviewed: public image buckets are limited to WebP and 2 MiB (banners 500 KiB); voice messages (private, 10 MiB) and report evidence (private, 5 MiB) have authenticated, path/owner or access-function scoped policies. This was a policy review, not a direct adversarial upload/delete test.
- Supabase migration and Edge Function inventory completed. Six active functions were listed; deployed OTP and DM push functions use JWT verification. This does not replace code review or runtime endpoint tests.

### Supabase Advisors

| Advisor | Current result | Interpretation |
|---|---|---|
| Security | 62 `rls_enabled_no_policy` INFO findings; 51 authenticated-executable `SECURITY DEFINER` WARN findings; 1 leaked-password protection WARN | No-policy findings include private/internal schemas and do not alone prove exposure. The 51 functions are callable by `authenticated`, not `anon` in the catalog sample, and require per-function authorization proof. Leaked-password protection remains an unresolved Auth configuration item. |
| Performance | 11 unindexed foreign keys, 79 unused indexes, 1 multiple-permissive-policy warning on `room_members` SELECT | Performance findings require query/workload review; unused indexes were not removed. The two room roster SELECT policies are scoped to self or an already-joined room; no policy was changed. |
| Health | 0 findings | Advisor health checks were clean at review time. |

The catalog-wide triage covered all 51 authenticated-executable definer functions: `anon` execute grants 0/51; empty `search_path` 51/51; `auth.uid()` present in 50 and `phase3.actor()` in 1; explicit OTP guard marker in 46; role/owner/support table references in 23; financial ledger/audit references in 8; and none lacked a recognized principal-binding marker. These are syntactic catalog checks, not proof of the correctness of each authorization branch. High-impact examples reviewed included `manage_recharge_offer` (owner/admin check), owner dashboard/badge RPCs (owner check), room roster RPCs (membership check), OTP helpers, daily rewards and gift RPCs. Full manual branch-by-branch review and adversarial tests are **not complete**.

### Staging authorization assertions

Executed as `authenticated` with a reserved all-zero UUID in a rollback-only transaction. The database rejected:

1. `manage_recharge_offer` — `Admin access required`.
2. `owner_manage_tester_badge` — `Owner access required`.
3. `phase2_room_moderate` — `Verified account required`.

The first two show explicit role enforcement; the third shows the fake, unverified principal cannot reach room moderation. These assertions make no persistent data changes. They do not test valid owners, moderators, revoked roles, or actual support personnel. A preceding draft assertion expected the wrong moderation error text and was rolled back; the corrected assertion passed.

### Local code checks

- On the local checkout at `4444dd6`, `npm run lint` passed (`tsc --noEmit`), `node --test tests/treasury.test.mjs` passed (**5/5**), and `npm run build` passed. This older checkout did not contain the current remote `LevelsModal.tsx`, so these results did not validate the exact GitHub branch snapshot.
- On GitHub branch commit `f37ba29896daa8dc74a7f93eb9d52257749c822c`, Actions run 379 passed the TypeScript check and the royal 200-level progression test. No APK was built.
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

One confirmed syntax/build defect was fixed: an extra `}` at `src/components/LevelsModal.tsx:141` caused `TS1381` in the GitHub Staging TypeScript workflow. The fix commit is `f37ba29896daa8dc74a7f93eb9d52257749c822c`; run 379 then passed TypeScript and the 200-level progression test. No database security change or migration was made because no exploitable database authorization defect was confirmed, and broader behavior tests are still outstanding.

This report is the only intended repository change from this pass. The initial report commit on this branch is `78439541fa52a776ab91bdf74b2daa309d7348c6`. The metadata follow-up is `dcd780b184f5029ef5c76e7f6cab300e25ed48fa`; catalog triage was recorded in `9ef5b213a6240cc36e5a976e8453c842832d7a26`; database grant/storage findings were recorded in `84b6078243b5547b1840d70bc6ce6aff45215a4e`; code fix: `f37ba29896daa8dc74a7f93eb9d52257749c822c`. Existing untracked image files are excluded from these commits.

## Release gate

**Decision: not ready for final acceptance or publication.** The current evidence is insufficient to certify the full role matrix, all 51 definer functions, Auth leaked-password protection, storage policies, real financial concurrency, all app workflows, or CI. No APK was built, and stable audio/music code was not changed.

## Content Moderation & Brand Protection — 2026-11-13 follow-up

### Server-side text protection

- **Status:** منفذ ويحتاج فحصاً.
- Migration `20261113160000_content_text_brand_guard` was applied to Supabase Staging and committed on the allowed branch at `1c8f6b1054471ac93c15e00aee213c54b893dbb8`.
- Database triggers now validate changed profile display names/bios, room titles/welcome messages, agency names, and agency registration names. The existing text is not rewritten or deleted.
- Normalization covers Arabic alef variants, Arabic/Persian digits, diacritics, tatweel, zero-width characters, punctuation/spacing, and common Latin leetspeak substitutions. Configured high-signal explicit terms and reserved TotiChat spellings are blocked in these identity fields. Identity reservation applies to account/room/agency display names, not ordinary conversation mentions. URLs/invite patterns in public identity/profile fields require the explicit `external_app_promotion` permission; TotiChat identity requires `brand_identity_use`.
- These permission names are checked against the authenticated account's live `phase3.admin_access.permissions` row. A synthetic unassigned UUID test returned false for both permissions and the reserved-brand attempt was rejected. No real account was given a role or permission.
- No existing user records or balances were changed. Trigger tests against actual profiles/rooms were avoided because Staging contains real user data. A direct rollback-only SQL test exercised normalization and validation functions, not the full authenticated mobile RPC path.

### Test results

- SQL assertion suite passed: Latin separators normalize to `totichat`; Arabic diacritics normalize to `توتيشات`; reserved TotiChat name, explicit `PornHub`, and promotional URL were rejected; natural Arabic profile text and ordinary app-comparison/welcome text passed.
- Rollback-only permission check passed: an unassigned synthetic user cannot use either exceptional permission.
- `npm run lint` in an isolated checkout could not start because its dependencies were absent (`tsc: not found`); no dependencies were installed. The GitHub combined status for the new commit must be checked before treating TypeScript/CI as passed.
- The Content Protection migration is server-side text enforcement only. It does not include admin settings UI, grant/revoke RPCs, audit events, appeals, competitor-name inventory, or automated semantic classifiers.

### Images, logos, and outstanding scope

- **Image filtering status:** غير منفذ. User image uploads still have direct paths into the existing public avatar and room-image buckets. No image classifier, logo-similarity check, quarantine/review queue, or fail-closed image publication flow was activated. No paid provider was selected or enabled.
- The earlier draft image migration was not applied because it would have blocked existing upload paths before those paths were migrated and tested. Existing images were not scanned or deleted.
- The application still needs a private quarantine upload flow, server-side file-signature/dimension checks, restricted reviewer UI, controlled publication, appeals/retention cleanup, and a reviewed image/logo classifier or an explicit manual-review operating model.
- The separate permissions are recognized by the database guard, but owner-only grant/revoke UI and audit records for permission changes remain unimplemented. Link or competitor app names without a URL are not comprehensively classified by this migration.
- The full role matrix, complete 51-function source review, economy tests, leaked-password configuration, and role-isolated fixtures remain open. Overall release/acceptance status remains **غير جاهز**.
