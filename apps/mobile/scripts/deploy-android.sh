#!/bin/sh
# Build the Android app bundle (.aab) on EAS and, when possible, send it to Google Play (internal testing track).
# Usage, from the repo root: yarn deploy:android [extra eas build flags]
#
# Google requires the very first .aab to be uploaded by hand in the Play Console. After that, put a Google Play
# service-account key at apps/mobile/google-play-key.json (git-ignored) and uploads become automatic.
set -e
cd "$(dirname "$0")/.."
. scripts/deploy-checks.sh

if [ -f google-play-key.json ]; then
  echo "→ Build EAS + envoi sur Google Play (test interne)…"
  yarn dlx eas-cli build --platform android --profile production --auto-submit "$@"
  echo "✅ Envoyé sur Google Play → Tester → Test interne. Passe-le en test fermé / production depuis la Play Console."
else
  echo "→ Build EAS (.aab)…"
  yarn dlx eas-cli build --platform android --profile production "$@"
  echo "✅ Build prêt : télécharge le .aab depuis le lien EAS ci-dessus et dépose-le dans la Play Console"
  echo "   (Tester → Test fermé → Créer une version). Pour automatiser les prochains envois : docs/mobile.md."
fi
