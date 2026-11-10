#!/bin/sh
# Build a Release Envly and install it on the plugged-in iPhone (free Apple ID, 7-day signing).
# Usage: sh scripts/install-iphone.sh [device-udid]
set -e
cd "$(dirname "$0")/.."
DEVICE="${1:-$(xcrun devicectl list devices 2>/dev/null | awk '/physical/ && /connected/ {for (i=1;i<=NF;i++) if ($i ~ /^[0-9A-F]{8}-[0-9A-F]{16}$/) print $i; exit}')}"
[ -n "$DEVICE" ] || { echo "Aucun iPhone branché."; exit 1; }
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://www.envly.fr}"
echo "Build pour $DEVICE avec API $EXPO_PUBLIC_API_URL…"
xcodebuild -workspace ios/Envly.xcworkspace -scheme Envly -configuration Release \
  -destination "id=$DEVICE" -derivedDataPath ios/build \
  -allowProvisioningUpdates -allowProvisioningDeviceRegistration build -quiet
xcrun devicectl device install app --device "$DEVICE" ios/build/Build/Products/Release-iphoneos/Envly.app
xcrun devicectl device process launch --device "$DEVICE" fr.envly.app || echo "Installée. Si iOS bloque l'ouverture : Réglages > Général > VPN et gestion de l'appareil > faire confiance au développeur."
echo "✅ Envly est sur ton iPhone."
