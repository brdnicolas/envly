// Envly brand: chrome shooting star on near-black.
// One source of truth → every icon / favicon / splash the app and the site need.
// Usage: yarn brand  (from the repo root)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

// ── Geometry (1024 grid) ────────────────────────────────────────────────
const C = { x: 600, y: 420 }; // star centre
const R = 250; // tip distance
const K = 24; // how "pinched" the arms are (smaller = thinner arms)
const tips = {
  t: [C.x, C.y - R],
  r: [C.x + R, C.y],
  b: [C.x, C.y + R],
  l: [C.x - R, C.y],
};
const ctrl = {
  tr: [C.x + K, C.y - K],
  br: [C.x + K, C.y + K],
  bl: [C.x - K, C.y + K],
  tl: [C.x - K, C.y - K],
};
const p = ([x, y]) => `${x} ${y}`;
const star = `M${p(tips.t)}Q${p(ctrl.tr)} ${p(tips.r)}Q${p(ctrl.br)} ${p(tips.b)}Q${p(ctrl.bl)} ${p(tips.l)}Q${p(ctrl.tl)} ${p(tips.t)}Z`;
// The four facets (centre → tip → curve → tip) give the bevelled chrome look.
const facet = (a, c, b) => `M${p([C.x, C.y])}L${p(tips[a])}Q${p(ctrl[c])} ${p(tips[b])}Z`;

// Trail: a tapered sweep from the lower-left that tucks under the star.
const trail = `M168 872C330 770 450 640 548 482C562 508 584 532 612 552C462 680 336 784 168 872Z`;
const trail2 = `M262 892C380 820 476 738 556 650`;

// Small sparkle helper (4-point star)
const sparkle = (x, y, r) => {
  const k = r * 0.16;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
};

const defs = `
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1B1B1E"/><stop offset="1" stop-color="#050506"/>
  </linearGradient>
  <radialGradient id="glow" cx="${C.x}" cy="${C.y}" r="420" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".16"/><stop offset=".45" stop-color="#FFFFFF" stop-opacity=".05"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="fTL" x1="${tips.l[0]}" y1="${tips.t[1]}" x2="${C.x}" y2="${C.y}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#F1F1F4"/><stop offset="1" stop-color="#B4B4BC"/>
  </linearGradient>
  <linearGradient id="fTR" x1="${tips.r[0]}" y1="${tips.t[1]}" x2="${C.x}" y2="${C.y}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#E4E4EA"/><stop offset=".45" stop-color="#55555C"/><stop offset="1" stop-color="#A2A2AA"/>
  </linearGradient>
  <linearGradient id="fBR" x1="${tips.r[0]}" y1="${tips.b[1]}" x2="${C.x}" y2="${C.y}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#C7C7CE"/><stop offset="1" stop-color="#7A7A82"/>
  </linearGradient>
  <linearGradient id="fBL" x1="${tips.l[0]}" y1="${tips.b[1]}" x2="${C.x}" y2="${C.y}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#2A2A2F"/><stop offset=".55" stop-color="#5C5C64"/><stop offset="1" stop-color="#D2D2D8"/>
  </linearGradient>
  <linearGradient id="tr" x1="168" y1="872" x2="600" y2="510" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".55" stop-color="#C9C9D0" stop-opacity=".45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".95"/>
  </linearGradient>
</defs>`;

/** The mark itself (no background). `mono` = flat single colour (Android themed icon). */
function mark({ mono = null, glow = true } = {}) {
  if (mono) {
    return `<path d="${trail}" fill="${mono}" opacity=".55"/><path d="${star}" fill="${mono}"/>`;
  }
  return `
  ${glow ? `<circle cx="${C.x}" cy="${C.y}" r="420" fill="url(#glow)"/>` : ""}
  <path d="${trail}" fill="url(#tr)"/>
  <path d="${trail2}" fill="none" stroke="url(#tr)" stroke-width="7" stroke-linecap="round" opacity=".55"/>
  <path d="${sparkle(318, 618, 18)}" fill="#FFFFFF" opacity=".55"/>
  <path d="${sparkle(236, 742, 11)}" fill="#FFFFFF" opacity=".35"/>
  <path d="${facet("t", "tl", "l")}" fill="url(#fTL)"/>
  <path d="${facet("t", "tr", "r")}" fill="url(#fTR)"/>
  <path d="${facet("r", "br", "b")}" fill="url(#fBR)"/>
  <path d="${facet("b", "bl", "l")}" fill="url(#fBL)"/>
  <path d="${star}" fill="none" stroke="#FFFFFF" stroke-opacity=".18" stroke-width="2"/>`;
}

/** Fit the mark (whose art spans ~118..865 × 155..930) into a square with padding. */
function svg({ size = 1024, background = true, radius = 0, pad = 0, mono = null, glow = true }) {
  const scale = (1024 - pad * 2) / 1024;
  const bg = background
    ? `<rect width="1024" height="1024" rx="${radius}" fill="url(#bg)"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${bg}<g transform="translate(${pad} ${pad}) scale(${scale})">${mark({ mono, glow })}</g></svg>`;
}

async function png(file, svgString, size) {
  const out = join(root, file);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(svgString)).resize(size, size).png().toFile(out);
  console.log("✓", file);
}

function write(file, content) {
  const out = join(root, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
  console.log("✓", file);
}

// ── Sources ─────────────────────────────────────────────────────────────
const fullBleed = svg({}); // iOS masks the corners itself
const rounded = svg({ radius: 230 }); // web / favicon
write("scripts/brand/envly-icon.svg", fullBleed);
write("apps/web/public/favicon.svg", rounded);
// Header / inline use: the bare mark, cropped tight around the art, no app-icon tile.
write("apps/web/public/logo.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="160 160 700 740">${defs}${mark({ glow: false })}</svg>`);

// OG images (apps/web/src/lib/og) embed the bare mark as a PNG (satori has no SVG gradients support).
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="700" height="740" viewBox="160 160 700 740">${defs}${mark({ glow: false })}</svg>`))
  .resize(240)
  .png()
  .toFile(join(root, "apps/web/assets/og/star.png"));
console.log("✓ apps/web/assets/og/star.png");

{
  // App header mark (transparent, tight crop) — the mobile twin of public/logo.svg
  const bare = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="740" viewBox="160 160 700 740">${defs}${mark({ glow: false })}</svg>`;
  const out = join(root, "apps/mobile/assets/images/logo-mark.png");
  await sharp(Buffer.from(bare)).resize(140, 148).png().toFile(out);
  console.log("✓ mobile/assets/images/logo-mark.png");
}

// ── Mobile app ──────────────────────────────────────────────────────────
await png("apps/mobile/assets/images/icon.png", fullBleed, 1024);
await png("apps/mobile/assets/images/splash-icon.png", svg({ background: false, pad: 60 }), 512);
await png("apps/mobile/assets/images/favicon.png", rounded, 48);
// Android adaptive icon: art must sit in the central 66% safe zone.
await png("apps/mobile/assets/images/android-icon-foreground.png", svg({ background: false, pad: 190 }), 512);
await png("apps/mobile/assets/images/android-icon-background.png", `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1024 1024">${defs}<rect width="1024" height="1024" fill="url(#bg)"/></svg>`, 512);
await png("apps/mobile/assets/images/android-icon-monochrome.png", svg({ background: false, pad: 190, mono: "#FFFFFF" }), 432);

// ── Chrome extension ──
for (const size of [16, 48, 128]) await png(`apps/extension/icons/icon-${size}.png`, rounded, size);

// ── Website / PWA ───────────────────────────────────────────────────────
await png("apps/web/public/icon-192.png", rounded, 192);
await png("apps/web/public/icon-512.png", rounded, 512);
await png("apps/web/public/icon-maskable-512.png", svg({ pad: 110 }), 512);
await png("apps/web/public/apple-touch-icon.png", fullBleed, 180);
await png("scripts/brand/preview-1024.png", rounded, 1024);

// favicon.ico (Next serves src/app/favicon.ico): ICO container holding PNG images.
{
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map((s) => sharp(Buffer.from(rounded)).resize(s, s).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(s, e);
    header.writeUInt8(s, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(pngs[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  write("apps/web/src/app/favicon.ico", Buffer.concat([header, ...pngs]));
}
