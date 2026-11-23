#!/usr/bin/env bash
set -euo pipefail

apk="$1"
for attempt in {1..5}; do
  if adb shell service check package | grep -q ': found'; then
    if output=$(adb install --no-streaming -r "$apk" 2>&1); then
      printf '%s\n' "$output"
      exit 0
    fi
    printf '%s\n' "$output" >&2
    if ! grep -Eiq 'broken pipe|device offline|service package|device .*not found' <<< "$output"; then
      exit 1
    fi
  fi
  if (( attempt < 5 )); then sleep 15; fi
done
echo 'Android emulator package service did not become ready for installation.' >&2
exit 1
