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
for attempt in 1 2 3; do
  set +e
  OUTPUT="$(adb install --no-streaming -r android/app/build/outputs/apk/debug/app-debug.apk 2>&1)"
  RESULT=$?
  set -e
  echo "$OUTPUT"
  if [[ "$RESULT" -eq 0 && "$OUTPUT" == *Success* ]]; then
    echo "APK installed successfully"
    break
  fi
  if ! echo "$OUTPUT" | grep -Eiq 'Broken pipe|service package|device offline|device not found|timed out'; then
    echo "::error::Non-transient APK install failure"
    exit 1
  fi
  if [[ "$attempt" == "3" ]]; then
    echo "::error::APK installation failed after transient retries"
    exit 1
  fi
  sleep 20
  adb wait-for-device
done
adb shell pm path com.numyar.totichat.staging
adb shell monkey -p com.numyar.totichat.staging 1
