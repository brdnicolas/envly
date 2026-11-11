#!/bin/sh
# Vercel's own `yarn` is Yarn 1, which ignores .yarnrc.yml: run the Yarn 4 pinned at the repo root instead.
# Usage (from apps/web, see vercel.json): sh scripts/vercel-yarn.sh <yarn args>
set -e
YARN="$(dirname "$0")/../../../.yarn/releases/yarn-4.10.3.cjs"
if [ ! -f "$YARN" ]; then
  echo "Monorepo files are missing. In Vercel: Settings > Build and Deployment > Root Directory >"
  echo "enable \"Include files outside the root directory in the Build Step\"."
  exit 1
fi
exec node "$YARN" "$@"
