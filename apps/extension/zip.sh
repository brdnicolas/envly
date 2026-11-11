#!/bin/sh
# Package the extension for the Chrome Web Store → apps/extension/dist/envly-extension.zip
# Only runtime files are shipped (store assets, docs and scripts stay out).
set -e
cd "$(dirname "$0")"
VERSION=$(node -p "require('./manifest.json').version")
mkdir -p dist
rm -f dist/envly-extension.zip
zip -qr dist/envly-extension.zip manifest.json background.js content.js popup.html popup.js popup.css icons -x "*.DS_Store"
echo "✓ dist/envly-extension.zip (v$VERSION, $(du -h dist/envly-extension.zip | cut -f1))"
