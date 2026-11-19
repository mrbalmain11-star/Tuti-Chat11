#!/usr/bin/env bash
set -euo pipefail
adb wait-for-device
for attempt in $(seq 1 90); do
  BOOT="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  PM="$(adb shell service check package 2>/dev/null || true)"
  if [[ "$BOOT" == "1" && "$PM" == *found* ]]; then
    echo "Android package service ready"
    break
  fi
  if [[ "$attempt" == "90" ]]; then
    echo "::error::Android emulator package service not ready"
    exit 1
  fi
  sleep 3
done
for attempt in $(seq 1 20); do
  if adb shell pm list packages >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == "20" ]]; then
    echo "::error::Android package manager not responding"
    exit 1
  fi
  sleep 3
done
wait_for_android_install_services() {
  local activity storage user_id volumes attempt
  for attempt in $(seq 1 90); do
    activity="$(adb shell service check activity 2>/dev/null | tr -d '\r' || true)"
    storage="$(adb shell service check mount 2>/dev/null | tr -d '\r' || true)"
    user_id="$(adb shell cmd activity get-current-user 2>/dev/null | tr -d '\r' || true)"
    volumes="$(adb shell sm list-volumes all 2>/dev/null | tr -d '\r' || true)"
    if [[ "$activity" == *found* && "$storage" == *found* && "$user_id" =~ ^[0-9]+$ && "$volumes" == *emulated* ]]; then
      echo "Android activity and storage services are ready"
      return 0
    fi
    sleep 2
  done
  echo "::error::Android activity/storage services did not become ready"
  echo "activity service: $activity"
  echo "storage service: $storage"
  echo "current user: $user_id"
  echo "storage volumes: $volumes"
  return 1
}

wait_for_android_install_services

for attempt in 1 2 3; do
  set +e
  OUTPUT="$(adb install --no-streaming -r android/app/build/outputs/apk/release/app-release.apk 2>&1)"
  RESULT=$?
  set -e
  echo "$OUTPUT"
  if [[ "$RESULT" -eq 0 && "$OUTPUT" == *Success* ]]; then
    echo "APK installed successfully"
    break
  fi
  if ! echo "$OUTPUT" | grep -Eiq 'Broken pipe|service package|device offline|device not found|timed out|NullPointerException.*StorageManager|getVolumes\\(\\).*null|Can.t find service: activity'; then
    echo "::error::Non-transient APK install failure"
    exit 1
  fi
  echo "Android emulator/package services were transiently unavailable; waiting and retrying install"
  if [[ "$attempt" == "3" ]]; then
    echo "::error::APK installation failed after transient retries"
    exit 1
  fi
  sleep 20
  adb wait-for-device
  wait_for_android_install_services
done
PKG="com.numyar.totichat.staging"
ACTIVITY="$PKG/.MainActivity"
adb shell pm path "$PKG"
adb shell am force-stop "$PKG"
adb logcat -c
START_OUTPUT="$(adb shell am start -W -n "$ACTIVITY" 2>&1 | tr -d '\r')"
echo "$START_OUTPUT"
if ! echo "$START_OUTPUT" | grep -q "Status: ok"; then
  echo "::error::Android did not start TotiChat MainActivity"
  exit 1
fi
sleep 8
RESUMED="$(adb shell dumpsys activity activities 2>/dev/null | tr -d '\r' | grep -E 'mResumedActivity|topResumedActivity' | head -n 2 || true)"
echo "$RESUMED"
if ! echo "$RESUMED" | grep -q "$PKG"; then
  echo "::error::TotiChat MainActivity did not remain in the foreground"
  exit 1
fi
if ! adb shell pidof "$PKG" >/dev/null 2>&1; then
  echo "::error::TotiChat process exited after launch"
  exit 1
fi
APP_FATAL="$(adb logcat -d -t 1200 2>/dev/null | grep -E 'FATAL EXCEPTION|Fatal signal' | grep -F "$PKG" || true)"
if [[ -n "$APP_FATAL" ]]; then
  echo "$APP_FATAL"
  echo "::error::TotiChat reported a fatal error after launch"
  exit 1
fi
echo "TotiChat MainActivity launched and remained in the foreground"
