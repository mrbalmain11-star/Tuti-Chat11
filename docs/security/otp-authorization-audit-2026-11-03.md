# TotiChat Staging OTP authorization audit — 2026-11-03

## Scope and outcome
Read-only inspection of `pg_policies` for `public` and `storage`, plus `pg_proc` for public `SECURITY DEFINER` routines. **No existing RLS policy, Storage policy, or application RPC was changed in this audit.** OTP must remain disabled until enforcement and regression tests are complete.

### Exposed routes to protect
- Existing RLS policies allow authenticated Google sessions to access profile, wallet, message, room, music, and other app tables **before** email OTP verification.
- Storage policies for avatars, room images, and banners are separately defined; protecting only `public` tables is insufficient.
- 32 public `SECURITY DEFINER` functions are callable by `authenticated`. Some are read-only and others can mutate business state. Each must be reviewed and explicitly gated or otherwise proven safe.
- Supabase Edge Functions (including voice token issuance) need their own enforcement review. A frontend-only modal is not an authorization boundary.

### Prioritize privileged RPCs with writes / sensitive state
`claim_daily_reward`, `manage_recharge_offer`, `owner_manage_tester_badge`, `phase4_owner_topup_by_id`, `staging_create_my_room`, `staging_dm_mark_read`, `staging_moderate_room_microphone`, `staging_presence_ping`, `staging_purchase_vip`, `staging_self_support_gift`, `staging_send_dm`, `staging_toggle_follow`, `staging_update_my_room`.

### Privileged read routines
`daily_reward_status`, `live_rankings`, `owner_dashboard_counts`, `owner_dashboard_recent`, `owner_find_user_by_public_id`, `owner_list_tester_badges`, `phase2_room_members_visual`, `phase2_room_members_visual_v2`, `phase4_owner_recipient`, `search_cp_profiles`, `staging_my_charm_exp`, `staging_my_followed_ids`, `staging_my_wealth_exp`, `staging_presence_online`, `staging_profile_agency`, `staging_room_public_id`, `staging_visited_profile_status`, `totichat_room_owner_official_id`.

The remaining counted function, `otp_session_verified`, is the new session status helper; it returns a boolean and does not authorize access by itself.

## Required before enabling VITE_GOOGLE_EMAIL_OTP_ENFORCED
1. Rotate exposed Resend key, set `RESEND_API_KEY`, `OTP_HMAC_SECRET` and `OTP_FROM_EMAIL` as Staging function secrets; verify sender domain.
2. Confirm the deployed `google-email-otp-start` and `google-email-otp-verify` functions actually deliver and verify email, including rate limit and failure paths.
3. Enforce `public.otp_session_verified()` server-side on every protected Data API route. For existing permissive RLS, a separately added **RESTRICTIVE** policy can be used after reviewing anon/public visibility and table semantics; a permissive policy would not provide a gate.
4. Review all callable privileged RPCs; add verification inside each sensitive SECURITY DEFINER routine, preserving owner/admin checks. Review views and Realtime.
5. Apply suitable Storage policies and check public buckets / signed URLs; audit Edge Functions, especially voice token issuance.
6. Test old sessions, token refresh, multiple devices, logout, invalid/expired/used codes, and 5-attempt lockout.
7. Turn on the client feature flag only after server-side enforcement has been verified and user explicitly approves activation.

## Safe current state
The royal OTP UI is committed in `src/components/GoogleEmailOtpScreen.tsx` and wired behind a default-off environment flag. Both OTP Edge Functions are deployed in Staging with `verify_jwt=true`. Existing Google login remains usable. No APK was built.
