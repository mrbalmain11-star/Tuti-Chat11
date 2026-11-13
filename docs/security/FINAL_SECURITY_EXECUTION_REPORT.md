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

### CI and Advisor refresh after the text guard

- GitHub Actions run [43450892118](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43450892118) passed the Staging TypeScript check on migration commit `1c8f6b1054471ac93c15e00aee213c54b893dbb8`.
- GitHub Actions run [43451199835](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43451199835) passed the same check on report commit `4304f42bf699b1d8e192684548e0d07cd7bd9e18`. Neither run built an APK.
- Latest Supabase Advisor read after the follow-up deny policy: 62 `rls_enabled_no_policy` INFO findings, 51 authenticated-executable SECURITY DEFINER warnings, and the leaked-password protection warning remains. Performance remains 11 unindexed foreign keys and 79 unused indexes; Health returned 0 findings. No database grants or existing rows were changed to address these advisories.


### Explicit deny policy and final CI check

- Migration `20261113170000_content_policy_terms_deny` was applied on Staging and committed at `cc71b84783da9b5593985945c0f89000b70fcbd2`. It adds an explicit `FOR ALL TO public USING (false) WITH CHECK (false)` policy to the policy-term table; table grants remain revoked. This removed the extra Advisor no-policy finding introduced by the configuration table.
- After the deny policy, rollback-only SQL assertions again passed for an unassigned synthetic identity, reserved-brand rejection, and natural Toti mention in profile text.
- Actions [43451620628](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43451620628) passed TypeScript on `cc71b84783da9b5593985945c0f89000b70fcbd2`; [43451485822](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43451485822) passed on report commit `8bce2923e4ef119933a71b9f6dc1fe2f45c4e305`. These were TypeScript-only workflows; neither built an APK.

### Arabic normalization regression check

- Migration `20261113171000_content_arabic_normalization_fix` was applied to Staging and committed at `e8103cf69deac451b44f8ad8cea21f01f0ff045d`.
- It normalizes Arabic ta marbuta (`ة`) to ha (`ه`) to match common variants in explicit high-signal prohibited terms. SQL assertions passed for `إباحية` normalization and rejection; a natural profile mention of Toti remained allowed.
- Post-migration read confirmed 35 profiles, 21 rooms, 3 room memberships, and 0 negative wallets. No user data was modified.
- Database privilege check confirmed `anon` cannot execute any new helper; `authenticated` may call only `content_has_permission` and the pure text normalizer. The validator and trigger function are not directly executable by either `anon` or `authenticated`.
- GitHub Actions [43452228884](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43452228884) passed TypeScript on `e8103cf69deac451b44f8ad8cea21f01f0ff045d`. This does not execute SQL-specific integration tests or build an APK.

## Room sanctions and timed room bans — 2026-11-13 follow-up

### Implemented on Staging

- Migration `room_timed_bans_20261113180000` was applied successfully to Supabase Staging. It adds `expires_at` to `public.room_bans`; existing records remain permanent (`NULL` expiry), so no users, bans or balances were deleted or rewritten.
- `phase2_room_moderate_voice_relay_v2` accepts only room `ban` and `unban`, validates the verified session and current owner/moderator membership, validates the fixed duration allowlist, serializes requests, and binds each idempotency key to the duration and target. Only `service_role` can execute it; `anon` and `authenticated` grants are false. A smoke call carrying authenticated claims was rejected as expected.
- Room durations exposed in the current action are permanent, 10m, 30m, 1h, 6h, 12h, 24h, 3d, 7d and 30d. The database, not the Android/UI value, calculates the expiry. A room-join trigger rejects only active bans; the room-ban list omits expired records and returns expiry for active temporary bans.
- Room moderators may remove only a ban they issued; the room owner may remove room bans in their room. The protected account rules and original room moderation RPC remain in force. Platform-staff room bans explicitly remain permanent. Existing kick/mute/seat actions keep using the previous relay path; no voice or music engine code was changed.
- Edge Function `phase2-voice-moderate` is active at deployed version 10 (`verify_jwt=true`). It routes only `ban` through the new duration RPC; other supported actions continue through the existing RPC and LiveKit path.

### Verification and commits

- Database assertions passed for the expiry column, active-ban join predicate, permanent platform-staff bans, and the private idempotency-table policy. Function grants verified: `anon=false`, `authenticated=false`, `service_role=true`. A rollback-free authorization smoke call using synthetic UUID claims verified that an authenticated caller cannot invoke the privileged relay.
- Actions run [43471030593](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43471030593) failed because the large UI source file was accidentally truncated while transferring the first commit. The complete file was restored in commit `ef316df2ee9d0cc02161af3fe8e33705f806f78f`; its UTF-16 character and line counts were checked against the local source. Actions run [43471897167](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43471897167) then passed TypeScript and the 200-level progression test. No APK was built.
- Implementation commit: `4ef4b6855bc3dc83e1f04a1ad674617ece0f578b`; repair commit/current branch head: `ef316df2ee9d0cc02161af3fe8e33705f806f78f`.
- Latest Supabase Advisor snapshot: 62 RLS-without-policy INFO findings, 52 authenticated-callable SECURITY DEFINER WARN findings, 1 leaked-password protection WARN; performance has 11 unindexed-FK INFO, 80 unused-index INFO and 1 multiple-permissive-policy WARN; Health has no findings. These are not cleared by the room-ban migration.

### Status and remaining gaps

- **Room temporary/permanent ban backend:** منفذ ويحتاج فحصاً. The database denial and relay grant checks passed, but no isolated owner/moderator/member identities are available to safely run the positive owner and moderator cases against real Staging identities.
- **Room ban revocation, expiry, cross-room scope and concurrency:** منفذ ويحتاج فحصاً. Expiry is enforced on membership creation and the RPC has locking/idempotency, but no concurrent isolated integration test or actual expiry wait test was run.
- **Full punishment system:** منفذ جزئياً. Application-wide warnings, restrictions and bans; duration mutes; immutable sanction history; appeals/escalation; and the admin punishment center are not implemented in this change.
- **Image moderation and logo/competitor detection:** غير منفذ. Public image upload paths are not quarantined; no paid or free classifier, reviewer queue, appeal workflow, or publication gate is active.
- **Role matrix, remaining SECURITY DEFINER/RLS review, economy tests and leaked-password setting:** still open as listed above. Overall readiness remains **غير جاهز**.

## Room-ban appeals — 2026-11-13 follow-up

- Migration `room_ban_appeals_20261113200000` was applied to Staging. It adds private appeal records, a separate decision-event log, and an idempotency table. The appeal remains keyed to the current ban version so a new ban requires a new appeal.
- A verified user can submit one appeal for their active room ban from the room-entry rejection. The room owner reviews it first and can lift or uphold the ban with a recorded reason. After an owner rejection, the user can escalate to TotiChat administration. The admin decision is restricted by the existing owner/main-partner authorization helper. Every mutation is checked by the server and recorded in the appeal event table and security audit log.
- Added an admin-center panel to load appeals by room UUID and review pending or escalated cases. Appeal tables are not directly readable by `anon` or `authenticated`; RPC execute is denied to `anon` and granted to `authenticated` only. The RPC uses `SECURITY DEFINER` with an empty search path. SQL assertions confirmed these grants and denied a synthetic nonexistent account.
- GitHub Actions [43476982841](https://github.com/mrbalmain11-star/Tuti-Chat11/actions/runs/43476982841) passed TypeScript and the 200-level progression test. No APK was built. Feature commit: `366e3ccf72cb68f5e21a4e8722265be0b6e5a5cd`.
- Staging currently has zero room bans and zero appeals/events; no real user data was created or changed during the tests. Positive owner-review and escalation tests remain **منفذ ويحتاج فحصاً** because isolated owner/member test identities are unavailable.
- A precise owner response deadline and automatic escalation schedule were not activated: the 24/48-hour values in the earlier prompt were explicitly proposals rather than finalized settings, and `pg_cron` is not installed. The user can escalate after an owner rejection; escalation after no response is not implemented. The admin panel has no push notification. A complete status/history screen outside the room-entry prompt is also still open.
- The separate app-wide ban appeal flow described for an alternate account entering the owner’s customer-service room remains unimplemented. The app-wide ban/suspension system, support-room configuration, account-count enforcement, support-staff intake, and independent admin decision workflow remain open.
