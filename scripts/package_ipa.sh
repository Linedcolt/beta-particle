#!/usr/bin/env bash
# Packages the .xcarchive produced by `xcodebuild archive` into a .ipa that
# AltStore / SideStore can install and re-sign with your own Apple ID.
#
# We ad-hoc codesign (identity "-", no certificate needed) rather than leave
# the binary fully unsigned, because AltServer/SideStore read the embedded
# entitlements to know which capabilities (e.g. App Groups) to request when
# they generate your real free-developer provisioning profile. A fully
# unsigned bundle has no entitlements blob for them to read.
#
# Nested code must be signed before the bundle that contains it, so the
# keyboard.appex is signed first, then the containing .app.
set -euo pipefail

APP_NAME="kbapp"
ARCHIVE_PATH="build/${APP_NAME}.xcarchive"
APP_PATH="${ARCHIVE_PATH}/Products/Applications/${APP_NAME}.app"
PAYLOAD_DIR="build/Payload"
IPA_PATH="build/${APP_NAME}-unsigned.ipa"

APP_ENTITLEMENTS="ios/${APP_NAME}/${APP_NAME}.entitlements"
KEYBOARD_ENTITLEMENTS="ios/.targets/keyboard/generated.entitlements"

if [ ! -d "$APP_PATH" ]; then
  echo "error: $APP_PATH not found - did the xcodebuild archive step succeed?" >&2
  exit 1
fi

rm -rf "$PAYLOAD_DIR" "$IPA_PATH"
mkdir -p "$PAYLOAD_DIR"
cp -R "$APP_PATH" "$PAYLOAD_DIR/"

APP_IN_PAYLOAD="${PAYLOAD_DIR}/${APP_NAME}.app"
EXTENSION_IN_PAYLOAD="${APP_IN_PAYLOAD}/PlugIns/keyboard.appex"

if [ -d "$EXTENSION_IN_PAYLOAD" ] && [ -f "$KEYBOARD_ENTITLEMENTS" ]; then
  echo "Ad-hoc signing keyboard extension..."
  codesign --force --sign - \
    --entitlements "$KEYBOARD_ENTITLEMENTS" \
    "$EXTENSION_IN_PAYLOAD"
else
  echo "warning: keyboard.appex or its entitlements file was not found - skipping" >&2
fi

echo "Ad-hoc signing main app..."
if [ -f "$APP_ENTITLEMENTS" ]; then
  codesign --force --sign - \
    --entitlements "$APP_ENTITLEMENTS" \
    "$APP_IN_PAYLOAD"
else
  codesign --force --sign - "$APP_IN_PAYLOAD"
fi

echo "Zipping ${IPA_PATH}..."
(cd build && zip -qr "$(basename "$IPA_PATH")" Payload)

echo "Done: ${IPA_PATH}"
