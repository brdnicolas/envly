#!/bin/sh
# Shared by deploy-ios.sh / deploy-android.sh: EAS builds what is committed, and the store app
# talks to www.envly.fr, so the code must be committed, pushed (deployed) and green.
set -e

if [ -n "$(git status --porcelain)" ]; then
  echo "✋ Des changements ne sont pas commités : EAS ne les inclurait pas de façon fiable."
  git status --short | head -20
  echo "→ Commite (et pousse, pour que le serveur ait le même code), puis relance."
  exit 1
fi

if [ "$(git rev-parse @)" != "$(git rev-parse @{u} 2>/dev/null || git rev-parse @)" ]; then
  echo "⚠️  Ta branche n'est pas poussée : l'app publiée parlera à www.envly.fr, qui n'aura pas ce code."
  printf "Continuer quand même ? [o/N] "
  read -r answer
  [ "$answer" = "o" ] || [ "$answer" = "O" ] || exit 1
fi

echo "→ Vérifications (types + lint)…"
yarn typecheck
yarn lint
