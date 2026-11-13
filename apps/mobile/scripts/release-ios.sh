#!/bin/sh
# New App Store version: checks, version from commits (asks first), commit + tag + push, then EAS build + upload.
# Usage, from the repo root: yarn release:ios [major|minor|patch] [--dry-run]
set -e
cd "$(dirname "$0")/.."

case " $* " in *" --dry-run "*) exec node scripts/release.mjs "$@" ;; esac

. scripts/deploy-checks.sh
node scripts/release.mjs "$@"

echo "→ Build EAS + envoi sur App Store Connect…"
yarn dlx eas-cli build --platform ios --profile production --auto-submit
echo "✅ Envoyé. Dans App Store Connect : crée la version, choisis ce build, colle les « Nouveautés » ci-dessus, puis soumets."
