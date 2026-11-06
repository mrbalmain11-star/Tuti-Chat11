# Staging Firebase DM push — implementation handoff (2026-11-06)

## Implemented in branch (unverified)
- Matching Firebase Android client config stored outside the disposable Android tree.
- Both manually dispatched Android CI workflows restore config and run the native integration script after Capacitor sync.
- Native FCM dependency, Google Services plugin, messaging receiver and Capacitor TotiPush plugin are injected into the generated Android project.
- Android 13+ notification permission request is initiated from the native bridge.
- Background data-only FCM direct-message payload displays a generic, privacy-preserving notification.
- Notification tap supports cold start and warm activity reuse; React routes to Messages only after authentication, OTP and profile completion.
- Native FCM token registration is authenticated and stale tokens are removed on rotation/logout.
- Server-side DM sender source checks JWT, sender ownership, blocks and message replay; feature flag defaults off.

## Not yet verified / external setup required
1. No APK or Gradle build was run: owner explicitly requires separate permission. Check Java compilation, Gradle dependency resolution, generated manifest merge and real Android notification permission.
2. Supabase Staging Edge Function `send-direct-message-push` is **not deployed** as of inspection. Do not enable `VITE_ENABLE_DM_PUSH` until deployment and authenticated tests succeed.
3. Server-only `FCM_SERVICE_ACCOUNT_JSON` secret must be configured securely in Supabase by an authorized operator; never place its private key in GitHub or the Android bundle.
4. Verify Supabase `push_device_tokens` and `direct_message_push_claims` policies, real device token creation, logout cleanup and blocked-user behavior.
5. Test cold launch, warm launch, background/foreground notifications, denied permission, duplicate delivery, OTP gate, account switch and active voice room on real Android.
6. A device may need to reopen the app to refresh its token after Firebase rotates it in the background. A true live rotation listener needs additional lifecycle testing.

## Safety gates
- Staging branch only; do not change Main/Production.
- Do not modify the stable voice/music engine or successful APK packaging.
- Do not trigger a GitHub APK workflow without explicit separate owner approval.
- Do not call this feature production-ready or tested until the checklist above passes.
