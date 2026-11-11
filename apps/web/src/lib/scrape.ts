// Product scraper: turns a product page URL into title / price / images.
// Kept free of "@/" imports so it can also run under plain Node (scripts/scrape-bench.mjs).

import * as cheerio from "cheerio";
import { ProxyAgent, fetch as undiciFetch } from "undici";

type $Doc = cheerio.CheerioAPI;
type Rec = Record<string, unknown>;

export type ScrapeResult = {
  title: string;
  description: string;
  imageUrl: string;
  images: string[];
  price: number | null;
  currency: string | null;
  /** Which extractor provided each field (for debugging / benchmarking). */
  sources: { title: string | null; price: string | null; image: string | null };
};

type Candidate = {
  source: string;
  title?: string | null;
  description?: string | null;
  images?: string[];
  price?: number | null;
  currency?: string | null;
  /** Images from this source are trusted and skip the junk filter. */
  trustedImages?: boolean;
};

export class ScrapeError extends Error {
  code: "invalid_url" | "fetch_failed" | "no_product";
  constructor(code: "invalid_url" | "fetch_failed" | "no_product") {
    super(code);
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent": BROWSER_UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

type HttpResult = { status: number; body: string; finalUrl: string };

async function httpGet(
  url: string,
  opts: { proxy?: boolean; timeoutMs?: number; json?: boolean } = {}
): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  const headers = opts.json
    ? { ...FETCH_HEADERS, Accept: "application/json", "Sec-Fetch-Dest": "empty", "Sec-Fetch-Mode": "cors" }
    : FETCH_HEADERS;
  try {
    if (opts.proxy) {
      const proxyUrl = process.env.WEBSHARE_PROXY_URL;
      if (!proxyUrl) throw new Error("No proxy configured");
      const res = await undiciFetch(url, {
        dispatcher: new ProxyAgent(proxyUrl),
        headers,
        redirect: "follow",
        signal: controller.signal,
      });
      return { status: res.status, body: await res.text(), finalUrl: res.url || url };
    }
    const res = await fetch(url, { headers, redirect: "follow", signal: controller.signal });
    return { status: res.status, body: await res.text(), finalUrl: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

/** GET with direct fetch first, then the proxy (if configured). */
async function getWithFallback(
  url: string,
  opts: { json?: boolean; accept?: (r: HttpResult) => boolean } = {}
): Promise<HttpResult | null> {
  const accept = opts.accept ?? ((r: HttpResult) => r.status < 400);
  try {
    const r = await httpGet(url, { json: opts.json });
    if (accept(r)) return r;
  } catch {
    // fall through to proxy
  }
  if (process.env.WEBSHARE_PROXY_URL) {
    try {
      const r = await httpGet(url, { json: opts.json, proxy: true, timeoutMs: 15000 });
      if (accept(r)) return r;
    } catch {
      // give up
    }
  }
  return null;
}

export function isAntiBot(html: string): boolean {
  const small = html.length < 20000;
  return (
    html.includes("bm-verify") ||
    html.includes("_sec/verify") ||
    html.includes("cf-chl-") ||
    html.includes("captcha-delivery.com") || // DataDome
    html.includes("px-captcha") || // PerimeterX
    html.includes("validateCaptcha") || // Amazon (/errors/… and /errors_page/…)
    (small && html.includes("api-services-support@amazon.com")) ||
    (small && html.includes("<title>Just a moment...</title>")) ||
    // Cloudflare injects challenge-platform scripts into normal pages too,
    // so only treat it as a block on tiny interstitial pages.
    (small && html.includes("challenge-platform")) ||
    (small && /<title>\s*(Access Denied|Robot Check|Attention Required)/i.test(html)) ||
    (html.includes('http-equiv="refresh"') && html.length < 5000)
  );
}

async function fetchPage(url: string): Promise<HttpResult | null> {
  return getWithFallback(url, { accept: (r) => r.status < 400 && !isAntiBot(r.body) });
}

// ---------------------------------------------------------------------------
// URL handling
// ---------------------------------------------------------------------------

const TRACKING_PARAM =
  /^(utm_\w+|gclid|gclsrc|dclid|gbraid|wbraid|fbclid|msclkid|mc_cid|mc_eid|_ga|_gl|igshid|srsltid|epik|xtor|_kx|ttclid|twclid|yclid)$/i;

const SHORTENER_HOSTS = new Set([
  "amzn.to",
  "amzn.eu",
  "a.co",
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "ow.ly",
  "rb.gy",
  "shorturl.at",
  "s.click.aliexpress.com",
  "a.aliexpress.com",
]);

function isAmazon(u: URL) {
  return /(^|\.)amazon\.[a-z.]+$/i.test(u.hostname);
}

function amazonAsin(u: URL): string | null {
  if (!isAmazon(u)) return null;
  const m = u.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/asin)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

export function assertPublicHttpUrl(u: URL) {
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new ScrapeError("invalid_url");
  const h = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127|10|0)\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === "::1" ||
    h === "::" ||
    /^f[cd][0-9a-f]{2}:/.test(h) ||
    h.startsWith("fe80:")
  ) {
    throw new ScrapeError("invalid_url");
  }
}

/** Drop tracking params / fragments and canonicalise known shops (Amazon → /dp/ASIN). */
export function cleanUrl(raw: string): string {
  const u = new URL(raw.trim());
  u.hash = "";
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
  }
  const asin = amazonAsin(u);
  if (asin) return `${u.origin}/dp/${asin}`;
  return u.toString();
}

async function resolveShortener(url: string): Promise<string> {
  const u = new URL(url);
  if (!SHORTENER_HOSTS.has(u.hostname.replace(/^www\./, ""))) return url;
  try {
    const r = await httpGet(url, { timeoutMs: 6000 });
    return r.finalUrl || url;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function isRec(v: unknown): v is Rec {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/** Strip tags and decode HTML entities. */
export function htmlToText(s: string | null | undefined): string {
  if (!s) return "";
  if (!/[<&]/.test(s)) return s.replace(/\s+/g, " ").trim();
  return cheerio.load(`<body>${s}</body>`)("body").text().replace(/\s+/g, " ").trim();
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
}

function parseJsonLoose(text: string): unknown {
  const t = text
    .trim()
    .replace(/^<!--|-->$/g, "")
    .replace(/^\s*\/\/\s*<!\[CDATA\[|\/\/\s*\]\]>\s*$/g, "")
    .replace(/;\s*$/, "");
  try {
    return JSON.parse(t);
  } catch {
    try {
      // Some sites leave raw newlines/tabs inside JSON strings
      return JSON.parse(t.replace(/[\u0000-\u001F]+/g, " "));
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

const NUM_RE = /\d{1,3}(?:[ '’.,]\d{3})+(?:[.,]\d{1,2})?(?!\d)|\d+(?:[.,]\d{1,2})?/;

function normalizeNumber(raw: string): number | null {
  const s = raw.replace(/[ '’]/g, "");
  const dec = s.match(/[.,](\d{1,2})$/);
  const intPart = (dec ? s.slice(0, -dec[0].length) : s).replace(/[.,]/g, "");
  const n = parseFloat(intPart + (dec ? "." + dec[1] : ""));
  return Number.isFinite(n) ? n : null;
}

function validPrice(n: number | null): number | null {
  if (n == null || !Number.isFinite(n) || n <= 0 || n >= 1_000_000) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Parse a price value from structured data ("29.90", "1 299,00 €", 29.9).
 * Handles both "1.299,00" (FR/DE) and "1,299.00" (EN) separators.
 */
export function parsePrice(v: unknown): number | null {
  if (typeof v === "number") return validPrice(v);
  if (typeof v !== "string") return null;
  const s = v.replace(/[   ]/g, " ");
  // French "29€90"
  const euroCents = s.match(/(\d+)\s?€\s?(\d{2})(?!\d)/);
  if (euroCents) return validPrice(parseFloat(`${euroCents[1]}.${euroCents[2]}`));
  const m = s.match(NUM_RE);
  return m ? validPrice(normalizeNumber(m[0])) : null;
}

const CURRENCY_TOKEN = "(?:€|\\$|£|EUR|USD|GBP|CHF|CAD)";
const PRICE_IN_TEXT = new RegExp(
  `(\\d+)\\s?€\\s?(\\d{2})(?!\\d)|${CURRENCY_TOKEN}\\s?(${NUM_RE.source})|(${NUM_RE.source})\\s?${CURRENCY_TOKEN}`,
  "i"
);

/** Find a price in free text, requiring a currency next to the number. */
export function findPriceInText(text: string): number | null {
  const s = text.replace(/[   ]/g, " ");
  const m = s.match(PRICE_IN_TEXT);
  if (!m) return null;
  if (m[1] && m[2]) return validPrice(parseFloat(`${m[1]}.${m[2]}`));
  const num = m[3] || m[4];
  return num ? validPrice(normalizeNumber(num)) : null;
}

export function detectCurrency(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.trim();
  if (/^[A-Z]{3}$/.test(t)) return t;
  if (/€|\bEUR\b/i.test(t)) return "EUR";
  if (/£|\bGBP\b/i.test(t)) return "GBP";
  if (/\bCHF\b/i.test(t)) return "CHF";
  if (/CA\$|\bCAD\b/i.test(t)) return "CAD";
  if (/\$|\bUSD\b/i.test(t)) return "USD";
  return null;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

function imageUrlsFrom(v: unknown, depth = 0): string[] {
  if (depth > 3 || v == null) return [];
  if (typeof v === "string") return v.trim() ? [v.trim()] : [];
  if (Array.isArray(v)) return v.flatMap((x) => imageUrlsFrom(x, depth + 1));
  if (isRec(v)) {
    for (const key of ["url", "contentUrl", "src", "href", "large", "zoom", "original", "full", "uri"]) {
      const s = str(v[key]);
      if (s) return [s];
    }
  }
  return [];
}

const JUNK_IMAGE =
  /(^|[/_\-.])(favicons?|logos?|icons?|sprites?|pixel|tracking|badges?|1x1|placeholder|spacer|blank|loader|loading|avatars?|flags?|payment|paypal|visa|mastercard|trustpilot|rating|stars?)([/_\-.]|\d|$)/i;

function isJunkImage(url: string): boolean {
  const lower = url.toLowerCase();
  const path = lower.replace(/[?#].*$/, "");
  if (path.endsWith(".svg") || path.endsWith(".gif") || lower.startsWith("data:")) return true;
  if (JUNK_IMAGE.test(path)) return true;
  // Amazon site assets (banners, deals) live under /images/G/, products under /images/I/
  if (/media-amazon\.com\/images\/g\//.test(path)) return true; // path is lowercased
  // Tiny size hints like _50x50 / -32x32
  const size = path.match(/[_\-/](\d{1,4})x(\d{1,4})(?:[_\-./@]|$)/);
  if (size && Number(size[1]) < 100 && Number(size[2]) < 100) return true;
  const w = lower.match(/[?&](?:w|width)=(\d+)/);
  if (w && Number(w[1]) < 100) return true;
  return false;
}

function imageKey(abs: string): string {
  const noCdn = abs
    .replace(/\/cdn-cgi\/image\/[^/]+\//, "/")
    // Amazon size modifiers: 61rwzXHCUBL._AC_SL1500_.jpg / ._AC_SX679_.jpg → same image
    .replace(/(\/images\/I\/[^./]+)\.[^/]*?(\.\w+)$/, "$1$2");
  const path = noCdn.replace(/[?#].*$/, "");
  // Only collapse query-string variants when the path itself is an image file
  return /\.(jpe?g|png|webp|avif)$/i.test(path) ? path.replace(/_\d+x\d*(?=\.\w+$)/, "") : noCdn;
}

function finalizeImages(
  groups: { urls: string[]; trusted: boolean; source: string }[],
  base: string
): { images: string[]; firstSource: string | null } {
  const out: string[] = [];
  let firstSource: string | null = null;
  const seen = new Set<string>();
  for (const { urls, trusted, source } of groups) {
    for (const raw of urls) {
      if (!raw || raw.startsWith("data:")) continue;
      let abs: string;
      try {
        abs = new URL(raw.replace(/&amp;/g, "&"), base).href;
      } catch {
        continue;
      }
      if (abs.startsWith("http://")) abs = "https://" + abs.slice(7);
      if (!abs.startsWith("https://")) continue;
      if (!trusted && isJunkImage(abs)) continue;
      const key = imageKey(abs);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(abs);
      firstSource ??= source;
      if (out.length >= 30) return { images: out, firstSource };
    }
  }
  return { images: out, firstSource };
}

/** Largest candidate from a srcset attribute. */
function bestFromSrcset(srcset: string): string | null {
  let best: string | null = null;
  let bestW = -1;
  for (const part of srcset.split(/,\s+(?=\S)/)) {
    const [u, d] = part.trim().split(/\s+/);
    if (!u) continue;
    const w = d ? parseFloat(d) * (d.endsWith("x") ? 1000 : 1) : 0;
    if (w > bestW) {
      bestW = w;
      best = u;
    }
  }
  return best;
}

function extractPageImages($: $Doc, html: string): { dom: string[]; raw: string[] } {
  const dom: string[] = [];
  $("img, picture source").each((_, el) => {
    const e = $(el);
    const w = Number(e.attr("width"));
    const h = Number(e.attr("height"));
    if ((w && w < 80) || (h && h < 80)) return;
    for (const attr of ["data-zoom-image", "data-large_image", "data-large-image", "data-old-hires", "data-src", "data-lazy-src", "data-original", "src"]) {
      const v = e.attr(attr);
      if (v && !v.startsWith("data:")) {
        dom.push(v);
        break;
      }
    }
    const srcset = e.attr("data-srcset") || e.attr("srcset");
    const best = srcset ? bestFromSrcset(srcset) : null;
    if (best) dom.push(best);
  });

  // Fallback for SPAs: image URLs embedded in inline JSON/JS (incl. escaped slashes)
  const raw: string[] = [];
  const unescaped = html.replace(/\\\//g, "/").replace(/\\u002F/gi, "/");
  const urlRegex = /https?:\/\/[^\s"'<>\\]+?\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>\\]*)?(?=[\s"'<>\\]|$)/gi;
  let m;
  while ((m = urlRegex.exec(unescaped)) !== null && raw.length < 200) {
    raw.push(m[0].replace(/[),;]+$/, ""));
  }
  return { dom, raw };
}

// ---------------------------------------------------------------------------
// Generic extractors
// ---------------------------------------------------------------------------

function hasType(node: Rec, ...types: string[]) {
  const t = asArray(node["@type"] as string | string[]).map((x) => String(x).toLowerCase());
  return types.some((ty) => t.some((x) => x === ty || x.endsWith("/" + ty) || x.endsWith(":" + ty)));
}

function collectTypedNodes(root: unknown, out: Rec[] = [], depth = 0): Rec[] {
  if (depth > 10 || !root || typeof root !== "object") return out;
  if (Array.isArray(root)) {
    for (const x of root) collectTypedNodes(x, out, depth + 1);
    return out;
  }
  const obj = root as Rec;
  if (obj["@type"]) out.push(obj);
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") collectTypedNodes(v, out, depth + 1);
  }
  return out;
}

function priceFromOffers(offers: unknown, depth = 0): { price: number | null; currency: string | null } {
  if (depth > 3) return { price: null, currency: null };
  for (const o of asArray(offers)) {
    if (!isRec(o)) continue;
    const specs = asArray(o.priceSpecification).filter(
      (s): s is Rec => isRec(s) && !/strikethrough|listprice|msrp/i.test(String(s.priceType ?? ""))
    );
    const candidates: [unknown, unknown][] = [
      [o.price, o.priceCurrency],
      [o.lowPrice, o.priceCurrency],
      ...specs.map((s) => [s.price, s.priceCurrency ?? o.priceCurrency] as [unknown, unknown]),
    ];
    for (const [p, c] of candidates) {
      const price = parsePrice(p);
      if (price != null) return { price, currency: str(c)?.toUpperCase() ?? null };
    }
    if (o.offers) {
      const nested = priceFromOffers(o.offers, depth + 1);
      if (nested.price != null) return nested;
    }
  }
  return { price: null, currency: null };
}

function extractJsonLd($: $Doc): Candidate | null {
  const nodes: Rec[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const data = parseJsonLoose($(el).text());
    if (data) collectTypedNodes(data, nodes);
  });
  const products = nodes.filter((n) => hasType(n, "product", "productgroup", "individualproduct", "productmodel"));
  if (!products.length) return null;

  // Nodes are collected parent-first, so a ProductGroup comes before its variants
  // (whose names are often just "Black" / "M"): take the first named node.
  const primary = products.find((p) => str(p.name)) ?? products[0];
  const variants = [primary, ...asArray(primary.hasVariant as Rec[]).filter(isRec), ...products];

  let price: number | null = null;
  let currency: string | null = null;
  for (const v of variants) {
    const r = priceFromOffers(v.offers);
    if (r.price != null) {
      price = r.price;
      currency = r.currency;
      break;
    }
  }

  const images = variants.flatMap((v) => imageUrlsFrom(v.image));

  return {
    source: "json-ld",
    title: htmlToText(str(primary.name)) || null,
    description: htmlToText(str(primary.description)) || null,
    images,
    price,
    currency,
    trustedImages: true,
  };
}

function extractMicrodata($: $Doc): Candidate | null {
  const scope = $('[itemtype*="schema.org/Product"]').first();
  const root = scope.length ? scope : $("body");

  const own = (prop: string) =>
    root.find(`[itemprop="${prop}"]`).filter((_, el) => {
      if (!scope.length) return true;
      return $(el).parents("[itemscope]").first().is(scope);
    });
  const val = (el: ReturnType<typeof root.first>) =>
    (el.attr("content") ?? el.attr("src") ?? el.attr("href") ?? el.attr("value") ?? el.text()).trim();

  const priceEl = root.find('[itemprop="price"], [itemprop="lowPrice"]').first();
  const price = priceEl.length ? parsePrice(val(priceEl)) : null;
  const currencyEl = root.find('[itemprop="priceCurrency"]').first();
  const currency = currencyEl.length ? detectCurrency(val(currencyEl)) : null;

  if (!scope.length && price == null) return null;

  const images: string[] = [];
  if (scope.length) {
    own("image").each((_, el) => {
      const v = val($(el));
      if (v) images.push(v);
    });
  }
  const nameEl = scope.length ? own("name").first() : null;
  const descEl = scope.length ? own("description").first() : null;

  return {
    source: "microdata",
    title: nameEl?.length ? htmlToText(val(nameEl)) : null,
    description: descEl?.length ? htmlToText(val(descEl)) : null,
    images,
    price,
    currency,
    trustedImages: true,
  };
}

function meta($: $Doc, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = $(`meta[property="${k}"], meta[name="${k}"], meta[itemprop="${k}"]`).first().attr("content");
    if (v?.trim()) return v.trim();
  }
  return null;
}

function extractMeta($: $Doc): Candidate {
  const images: string[] = [];
  $('meta[property="og:image:secure_url"], meta[property="og:image"], meta[property="og:image:url"], meta[name="twitter:image"], meta[name="twitter:image:src"], meta[property="twitter:image"]').each(
    (_, el) => {
      const c = $(el).attr("content");
      if (c) images.push(c);
    }
  );
  const imageSrc = $('link[rel="image_src"]').attr("href");
  if (imageSrc) images.push(imageSrc);

  const priceRaw = meta($, "product:price:amount", "og:price:amount", "product:sale_price:amount");
  const currencyRaw = meta($, "product:price:currency", "og:price:currency", "product:sale_price:currency");

  return {
    source: "meta",
    title: meta($, "og:title", "twitter:title") ?? ($("title").first().text().trim() || null),
    description: meta($, "og:description", "description", "twitter:description"),
    images,
    price: parsePrice(priceRaw),
    currency: detectCurrency(currencyRaw) ?? (priceRaw ? detectCurrency(priceRaw) : null),
    trustedImages: true,
  };
}

// --- Embedded app state (__NEXT_DATA__, window.__INITIAL_STATE__ = {...}, ...) ---

/** Extract the JSON object literal that follows `marker` in `src` (brace matching, string-aware). */
function sliceJsonObject(src: string, from: number): string | null {
  const start = src.indexOf("{", from);
  if (start < 0 || start - from > 20) return null;
  let depth = 0;
  let inStr: string | null = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'") inStr = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

const NAME_KEYS = ["name", "title", "productName", "product_name", "displayName"];
const PRICE_KEYS = ["price", "salePrice", "sale_price", "currentPrice", "finalPrice", "final_price", "sellingPrice", "priceValue", "prices", "pricing"];
const IMAGE_KEYS = ["image", "images", "imageUrl", "image_url", "mainImage", "media", "pictures", "photos", "gallery", "thumbnail"];

function priceFromAny(v: unknown, keyHint = "", depth = 0): { price: number | null; currency: string | null } {
  const none = { price: null, currency: null };
  if (depth > 3 || v == null) return none;
  const cents = /cent/i.test(keyHint);
  if (typeof v === "number") return { price: validPrice(cents ? v / 100 : v), currency: null };
  if (typeof v === "string") return { price: parsePrice(v), currency: detectCurrency(v) };
  if (isRec(v)) {
    const currency = detectCurrency(str(v.currency) ?? str(v.currencyCode) ?? str(v.currency_code));
    for (const k of ["value", "amount", "current", "sale", "final", "price", "selling", "centAmount", "priceInCents", "formatted", "formattedValue", "raw"]) {
      if (v[k] == null) continue;
      if (k === "centAmount") {
        const digits = typeof v.fractionDigits === "number" ? v.fractionDigits : 2;
        const n = Number(v[k]);
        if (Number.isFinite(n)) return { price: validPrice(n / 10 ** digits), currency };
      }
      const r = priceFromAny(v[k], k, depth + 1);
      if (r.price != null) return { price: r.price, currency: r.currency ?? currency };
    }
  }
  return none;
}

function extractEmbeddedState($: $Doc, html: string, titleHint: string | null): Candidate | null {
  const blobs: unknown[] = [];
  $('script#__NEXT_DATA__, script[type="application/json"]').each((_, el) => {
    const t = $(el).text();
    if (t.length > 20 && t.length < 5_000_000) {
      const d = parseJsonLoose(t);
      if (d) blobs.push(d);
    }
  });
  const assign = /(?:window\.)?__(?:INITIAL_STATE|PRELOADED_STATE|APOLLO_STATE|INITIAL_PROPS|STATE|DATA)__\s*=\s*/g;
  let m;
  while ((m = assign.exec(html)) !== null && blobs.length < 20) {
    const slice = sliceJsonObject(html, m.index + m[0].length);
    if (slice) {
      const d = parseJsonLoose(slice);
      if (d) blobs.push(d);
    }
  }
  if (!blobs.length) return null;

  const hint = titleHint ? norm(titleHint) : "";
  let best: { score: number; c: Candidate } | null = null;
  let visited = 0;

  const visit = (node: unknown, depth: number) => {
    if (depth > 14 || visited > 60_000 || !node || typeof node !== "object") return;
    visited++;
    if (Array.isArray(node)) {
      for (const x of node.slice(0, 200)) visit(x, depth + 1);
      return;
    }
    const o = node as Rec;
    const nameKey = NAME_KEYS.find((k) => typeof o[k] === "string" && (o[k] as string).length >= 3 && (o[k] as string).length <= 300);
    if (nameKey) {
      const priceKey = PRICE_KEYS.find((k) => o[k] != null);
      const imageKey = IMAGE_KEYS.find((k) => o[k] != null);
      const p = priceKey ? priceFromAny(o[priceKey], priceKey) : { price: null, currency: null };
      const images = imageKey ? imageUrlsFrom(o[imageKey]).filter((u) => /^(https?:)?\/\/|^\//.test(u)) : [];
      if (p.price != null || images.length) {
        const name = htmlToText(o[nameKey] as string);
        const n = norm(name);
        let score = (p.price != null ? 2 : 0) + (images.length ? 2 : 0) + (o.sku || o.brand || o.description ? 1 : 0);
        if (hint && n.length >= 4 && (hint.includes(n) || n.includes(hint))) score += 5;
        if (!best || score > best.score) {
          best = {
            score,
            c: { source: "embedded-state", title: name, images, price: p.price, currency: p.currency },
          };
        }
      }
    }
    for (const v of Object.values(o)) if (v && typeof v === "object") visit(v, depth + 1);
  };
  for (const b of blobs) visit(b, 0);

  const found = best as { score: number; c: Candidate } | null;
  // Require either a title match or a complete (price + image) object to limit false positives
  return found && found.score >= 4 ? found.c : null;
}

function extractDomPrice($: $Doc): Candidate | null {
  const selectors = [
    "[data-price]",
    '[class*="price" i]:not([class*="old" i]):not([class*="was" i]):not([class*="strike" i]):not([class*="crossed" i]):not([class*="before" i]):not([class*="regular" i]):not([class*="compare" i])',
  ];
  for (const sel of selectors) {
    const els = $(sel).toArray().slice(0, 40);
    for (const el of els) {
      const e = $(el);
      if (e.closest("del, s, strike").length) continue;
      const attr = e.attr("data-price");
      const fromAttr = attr ? parsePrice(attr) : null;
      if (fromAttr != null) return { source: "dom-price", price: fromAttr, currency: detectCurrency(e.text()) };
      const text = e.text();
      if (text.length > 80) continue;
      const p = findPriceInText(text);
      if (p != null) return { source: "dom-price", price: p, currency: detectCurrency(text) };
    }
  }
  return null;
}

function extractPriceFromRawHtml(html: string): Candidate | null {
  const prices: number[] = [];
  let m;
  const priceKeyRegex = /"(?:amount|price|salePrice|sale_price|currentPrice)"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/g;
  while ((m = priceKeyRegex.exec(html)) !== null) {
    const context = html.slice(Math.max(0, m.index - 200), m.index + 200).toLowerCase();
    if (/currency|eur|usd|gbp|€|\\u20ac|formatted/.test(context)) {
      const p = parsePrice(m[1]);
      if (p != null) prices.push(p);
    }
  }
  const formattedRegex = /"formatted(?:Value|Price)?"\s*:\s*"([^"]{1,30})"/g;
  while ((m = formattedRegex.exec(html)) !== null) {
    const p = findPriceInText(m[1].replace(/\\u20ac/gi, "€"));
    if (p != null) prices.push(p);
  }
  if (!prices.length) return null;
  const freq = new Map<number, number>();
  for (const p of prices) freq.set(p, (freq.get(p) || 0) + 1);
  const price = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { source: "raw-html", price };
}

// ---------------------------------------------------------------------------
// Platform-specific extractors
// ---------------------------------------------------------------------------

function isShopify(html: string) {
  return /cdn\.shopify\.com|Shopify\.shop\s*=|shopify-digital-wallet|window\.ShopifyAnalytics/.test(html);
}

async function fetchShopify(u: URL): Promise<Candidate | null> {
  const m = u.pathname.match(/^(.*?\/products\/[^/?#.]+)/);
  if (!m) return null;
  const r = await getWithFallback(`${u.origin}${m[1]}.js`, { json: true });
  if (!r) return null;
  const p = parseJsonLoose(r.body);
  if (!isRec(p) || !p.title || !Array.isArray(p.variants)) return null;

  const variants = p.variants.filter(isRec);
  const wanted = u.searchParams.get("variant");
  const variant =
    variants.find((v) => String(v.id) === wanted) ?? variants.find((v) => v.available) ?? variants[0];
  const cents = Number(variant?.price ?? p.price);
  const images = [
    ...imageUrlsFrom(isRec(variant?.featured_image) ? variant.featured_image.src : null),
    ...imageUrlsFrom(p.images),
  ].map((s) => (s.startsWith("//") ? "https:" + s : s));

  return {
    source: "shopify",
    title: htmlToText(str(p.title)),
    description: htmlToText(str(p.description)).slice(0, 1000) || null,
    images,
    price: Number.isFinite(cents) ? validPrice(cents / 100) : null,
    trustedImages: true,
  };
}

function isWooCommerce(html: string) {
  return /wp-content\/plugins\/woocommerce|woocommerce-product|wc-block/.test(html);
}

async function fetchWooCommerce(u: URL): Promise<Candidate | null> {
  const slug = u.pathname.split("/").filter(Boolean).pop();
  if (!slug) return null;
  const r = await getWithFallback(`${u.origin}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`, {
    json: true,
  });
  if (!r) return null;
  const arr = parseJsonLoose(r.body);
  const p = Array.isArray(arr) ? arr[0] : null;
  if (!isRec(p)) return null;
  const prices = isRec(p.prices) ? p.prices : {};
  const minor = typeof prices.currency_minor_unit === "number" ? prices.currency_minor_unit : 2;
  const raw = Number(prices.sale_price || prices.price);
  return {
    source: "woocommerce",
    title: htmlToText(str(p.name)),
    description: htmlToText(str(p.short_description) ?? str(p.description)).slice(0, 1000) || null,
    images: imageUrlsFrom(p.images),
    price: Number.isFinite(raw) ? validPrice(raw / 10 ** minor) : null,
    currency: str(prices.currency_code),
    trustedImages: true,
  };
}

function extractAmazon($: $Doc, html: string): Candidate {
  const title = $("#productTitle").text().trim() || null;

  let price: number | null = null;
  let currency: string | null = null;
  const priceEl = $(
    "#corePrice_feature_div .a-price .a-offscreen, #corePriceDisplay_desktop_feature_div .a-price .a-offscreen, #apex_desktop .a-price .a-offscreen, #price_inside_buybox, #priceblock_ourprice, #priceblock_dealprice, #tp_price_block_total_price_ww .a-offscreen"
  ).first();
  if (priceEl.length) {
    price = parsePrice(priceEl.text());
    currency = detectCurrency(priceEl.text());
  }
  if (price == null) {
    const whole = $(".a-price-whole").first().text().replace(/[^\d]/g, "");
    const frac = $(".a-price-fraction").first().text().replace(/[^\d]/g, "");
    if (whole) price = validPrice(parseFloat(`${whole}.${frac || "0"}`));
  }

  const images: string[] = [];
  const landing = $("#landingImage, #imgBlkFront").first();
  const hires = landing.attr("data-old-hires");
  if (hires) images.push(hires);
  const dyn = landing.attr("data-a-dynamic-image");
  if (dyn) {
    const d = parseJsonLoose(dyn);
    if (isRec(d)) {
      const sorted = Object.entries(d).sort(
        (a, b) => (asArray(b[1] as number[])[0] ?? 0) - (asArray(a[1] as number[])[0] ?? 0)
      );
      images.push(...sorted.map(([k]) => k));
    }
  }
  const hiResRe = /"hiRes"\s*:\s*"(https:[^"]+)"/g;
  let m;
  while ((m = hiResRe.exec(html)) !== null && images.length < 20) images.push(m[1]);

  return { source: "amazon", title, price, currency, images, trustedImages: true };
}

// ---------------------------------------------------------------------------
// Title cleanup
// ---------------------------------------------------------------------------

const TITLE_SEP = "\\s+[|\\-–—:·•»]\\s+";

/** Remove " | Site name" style prefixes/suffixes. */
export function cleanTitle(title: string, siteName: string | null, host: string): string {
  let t = htmlToText(title);
  const hostBrand = host.replace(/^www\./, "").split(".").slice(-2, -1)[0] ?? "";
  const brands = [siteName, hostBrand].filter((b): b is string => !!b && norm(b).length >= 3).map(norm);
  const isBrand = (seg: string) => {
    const n = norm(seg);
    return n.length > 0 && brands.some((b) => n.includes(b) || (n.length >= 3 && b.includes(n)));
  };
  for (let i = 0; i < 3; i++) {
    const trailing = t.match(new RegExp(`${TITLE_SEP}([^|–—:·•»]+)$`));
    if (trailing && isBrand(trailing[1]) && t.length - trailing[0].length >= 3) {
      t = t.slice(0, -trailing[0].length).trim();
      continue;
    }
    const leading = t.match(new RegExp(`^([^|–—:·•»]+?)${TITLE_SEP}`));
    if (leading && isBrand(leading[1]) && t.length - leading[0].length >= 3) {
      t = t.slice(leading[0].length).trim();
      continue;
    }
    break;
  }
  return t;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function merge(candidates: Candidate[], base: string, siteName: string | null): ScrapeResult {
  const pick = <K extends "title" | "description">(k: K) => {
    for (const c of candidates) {
      const v = c[k];
      if (v) return { value: v, source: c.source };
    }
    return { value: "", source: null };
  };
  const title = pick("title");
  const description = pick("description");

  let price: number | null = null;
  let priceSource: string | null = null;
  let currency: string | null = null;
  for (const c of candidates) {
    if (c.price != null) {
      price = c.price;
      priceSource = c.source;
      currency = c.currency ?? null;
      break;
    }
  }
  if (!currency && price != null) currency = candidates.find((c) => c.currency)?.currency ?? null;

  const { images, firstSource: imageSource } = finalizeImages(
    candidates.map((c) => ({ urls: c.images ?? [], trusted: !!c.trustedImages, source: c.source })),
    base
  );

  return {
    title: title.value ? cleanTitle(title.value, siteName, new URL(base).hostname) : "",
    description: htmlToText(description.value).slice(0, 1000),
    imageUrl: images[0] ?? "",
    images,
    price,
    currency,
    sources: { title: title.source, price: priceSource, image: imageSource },
  };
}

/** Extract product info from already-fetched HTML (no network). */
export function extractFromHtml(html: string, pageUrl: string, extra: Candidate[] = []): ScrapeResult {
  const $ = cheerio.load(html);
  const u = new URL(pageUrl);
  const metaC = extractMeta($);
  const jsonLd = extractJsonLd($);
  const micro = extractMicrodata($);
  const embedded = extractEmbeddedState($, html, jsonLd?.title ?? metaC.title ?? null);
  const pageImgs = extractPageImages($, html);

  const candidates: Candidate[] = [
    ...extra,
    ...(isAmazon(u) ? [extractAmazon($, html)] : []),
    ...(jsonLd ? [jsonLd] : []),
    ...(micro ? [micro] : []),
    metaC,
    ...(embedded ? [embedded] : []),
  ];
  if (!candidates.some((c) => c.price != null)) {
    const dom = extractDomPrice($) ?? extractPriceFromRawHtml(html);
    if (dom) candidates.push(dom);
  }
  candidates.push({ source: "page-img", images: pageImgs.dom }, { source: "raw-img", images: pageImgs.raw });

  const siteName = meta($, "og:site_name", "application-name");
  return merge(candidates, pageUrl, siteName);
}

export async function scrapeProduct(inputUrl: string): Promise<ScrapeResult> {
  let url: string;
  try {
    const parsed = new URL(inputUrl.trim());
    assertPublicHttpUrl(parsed);
    url = cleanUrl(await resolveShortener(parsed.href));
    assertPublicHttpUrl(new URL(url));
  } catch (e) {
    if (e instanceof ScrapeError) throw e;
    throw new ScrapeError("invalid_url");
  }

  const page = await fetchPage(url);
  const finalUrl = page?.finalUrl ? cleanUrl(page.finalUrl) : url;
  const u = new URL(finalUrl);
  const html = page?.body ?? "";

  // Platform APIs: richer data, and often reachable even when the page is bot-protected
  const extra: Candidate[] = [];
  if (/\/products\/[^/]+/.test(u.pathname) && (!html || isShopify(html))) {
    const shop = await fetchShopify(u).catch(() => null);
    if (shop) extra.push(shop);
  }

  if (!html && !extra.length) throw new ScrapeError("fetch_failed");

  let result = extractFromHtml(html, finalUrl, extra);

  if (html && isWooCommerce(html) && (result.price == null || !result.title)) {
    const woo = await fetchWooCommerce(u).catch(() => null);
    if (woo) result = extractFromHtml(html, finalUrl, [woo]);
  }

  if (!result.title || isGenericPage(result, u.hostname)) throw new ScrapeError("no_product");
  return result;
}

/**
 * A page whose only info is the site's own name ("Amazon.fr", "Fnac") is an
 * interstitial / error page we failed to recognise, not a product.
 */
function isGenericPage(r: ScrapeResult, host: string): boolean {
  if (r.price != null || r.images.length) return false;
  const t = norm(r.title);
  const hostNoWww = norm(host.replace(/^www\./, ""));
  const brand = norm(host.replace(/^www\./, "").split(".").slice(-2, -1)[0] ?? "");
  return t === hostNoWww || t === brand || t.length < 3;
}
