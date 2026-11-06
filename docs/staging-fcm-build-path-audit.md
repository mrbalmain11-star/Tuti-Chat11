# Staging FCM build-path audit — 2026-11-06

## Verified from repository files

- Both `.github/workflows/staging-apk.yml` and `.github/workflows/staging-verify.yml` remove the checked-in `android/` directory, then run `npx cap add android` and `npx cap sync android`.
- `capacitor.config.json` declares the actual staging package `com.numyar.totichat.staging`.
- The Firebase `android/app/google-services.json` committed earlier lists `com.totichat.app` and `com.totichat.beta`, **not** `com.numyar.totichat.staging`.
- The checked-in `android/app/src/main/java/com/totichat/app/*` Kotlin FCM implementation is removed by the CI build. It does not reach the installed staging APK.
- React/Supabase code in `src/` is the actual APK frontend. `src/services/pushDeviceRegistration.ts` cannot obtain a native FCM token without a Capacitor-native bridge/plugin.

## Required before enabling real push

1. Register **com.numyar.totichat.staging** as an Android app in Firebase project **totichatpro**. Obtain its matching google-services.json. Do not reuse the other packages' client configurations.
2. Add a Capacitor FCM integration to the regenerated Android project and bridge token registration to the verified Supabase auth session. Preserve the existing microphone permission bridge and audio behavior.
3. Ensure logout deletes the device's token for the previous authenticated user and that account changes cannot inherit old registrations.
4. Keep the build's established APK signing, packaging, ZIP extraction, and artifact publication unchanged.
5. Configure Firebase service-account credentials only as Supabase server secrets. Never commit or transmit private keys in chat.
6. Verify compilation, native token creation, auth-bound registration, logout, blocked-recipient behavior, background delivery, and notification tap routing on staging. APK building requires the owner's separate approval.

## Status

Audit completed; FCM integration in actual APK **not implemented**. Server push function exists in GitHub but is not deployed or enabled. No APK built during this audit.
