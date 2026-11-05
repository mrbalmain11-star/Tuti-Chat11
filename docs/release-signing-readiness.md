# TotiChat — Release signing readiness (planning only)

Status: NOT RELEASE READY. This document does not enable or trigger builds.

## Verified current build
- CI workflow: .github/workflows/staging-verify.yml
- CI regenerates Android from capacitor.config.json, so checked-in Android Gradle settings are not authoritative for the CI APK.
- Staging application ID: com.numyar.totichat.staging
- Current CI task: assembleDebug, with cached debug keystore.
- Existing APK/ZIP validation and audio/LiveKit behavior must remain unchanged.

## Approved product decisions
- Official website and future Google Play distributions should use the same production application ID.
- Proposed production application ID: com.totichat.app (must be confirmed before publishing).
- Staging must stay isolated from production; no changes to production or main.
- No build, publication, or production switch until separately authorized.

## Release implementation checklist
1. Select and freeze the production application ID and matching Google OAuth redirect URI. Configure Google OAuth Android SHA-1/SHA-256 certificate fingerprints and backend allowlists as required.
2. Generate a production signing key securely outside the repository. Back it up offline. Never commit keystore or passwords.
3. Configure GitHub Actions secrets for release signing, with least-privilege environment approvals. Never print keystore/password content to logs.
4. Add a separate manually triggered release workflow with an explicit approval gate, based on the known-good Android generation and ZIP packaging; do not change staging-verify.yml.
5. Build a non-debuggable, signed release APK and verify with apksigner verify --verbose --print-certs. Record package ID, versionCode, certificate SHA-256, and APK SHA-256.
6. Configure Google Play App Signing carefully. Play-distributed APKs are signed with the Play app signing key, which can differ from an upload key. For seamless cross-channel APK updates, the actual installed APK signing certificates must match. Do not assume using the same upload key guarantees this.
7. Test install, login, microphone, music, in-place update, and ZIP extraction on real Android devices. Verify Play Protect result independently; release signing alone does not guarantee removal of warnings.
8. Audit permissions and third-party dependencies, privacy policy, account deletion, user reporting/blocking, and in-app purchase policy before public distribution.

## Safety
- Do not change the audio engine, LiveKit, music, or working ZIP packaging.
- Do not change staging application ID or staging signing key.
- Never suggest disabling Play Protect.
