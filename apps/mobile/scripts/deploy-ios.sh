#!/bin/sh
# Build the iOS app on EAS and send it to App Store Connect (→ TestFlight).
# Usage, from the repo root: yarn deploy:ios [extra eas build flags, e.g. --no-wait]
# The build number is incremented by EAS (eas.json → production.autoIncrement).
set -e
cd "$(dirname "$0")/.."
. scripts/deploy-checks.sh

echo "→ Build EAS + envoi sur App Store Connect…"
yarn dlx eas-cli build --platform ios --profile production --auto-submit "$@"

echo "✅ Envoyé. Le build apparaîtra dans TestFlight après le traitement par Apple (10 à 30 min)."
