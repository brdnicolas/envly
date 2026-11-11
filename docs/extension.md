# Chrome extension

Manifest V3, no build step: `apps/extension` is loaded as-is.

| File | Role |
| --- | --- |
| `manifest.json` | Permissions, version |
| `background.js` | Calls the Envly API with the user's session cookie (lists, add wish, already-added check) |
| `content.js` | Detects product pages, reads title/price/photos, shows the button and the in-page panel (Shadow DOM, isolated from the site's CSS) |
| `popup.*` | Toolbar button: opens the panel on the current tab |
| `store/` | Chrome Web Store listing: description, screenshots, promo images (not shipped in the package) |

Behaviour:
- On **Amazon**, the button is drawn under "Acheter cet article". It sits in an overlay layer, not inside Amazon's buy box, with a low z-index so Amazon's zoom and menus stay above it.
- On other shops, a small floating button appears bottom-right, only on product pages.
- The user must be signed in on www.envly.fr in the same browser.

## Develop

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `apps/extension`.
2. After each change, click the reload arrow on the Envly card, then reload the shop page.

## Publish

```bash
yarn extension:zip        # → apps/extension/dist/envly-extension.zip
```

1. Bump `version` in `manifest.json` (the store refuses an existing version).
2. [Developer console](https://chrome.google.com/webstore/devconsole) → Envly → **Package** → upload the zip.
3. **Store listing**: text in [`store/listing.md`](../apps/extension/store/listing.md); images in `store/`:
   - Screenshots (1280×800): `capture-1.jpg` … `capture-5.jpg`, in order
   - Small promo tile (440×280): `promo-tile-440x280.jpg`
   - Marquee (1400×560): `marquee-1400x560.jpg`
   - Icon (128×128): `store-icon-128.png`
4. Submit for review.
