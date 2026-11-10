#!/usr/bin/env node
// Benchmark the product scraper against a list of real product URLs.
//
//   node scripts/scrape-bench.mjs                  # uses scripts/scrape-bench-urls.txt
//   node scripts/scrape-bench.mjs urls.txt         # custom list (one URL per line, # comments)
//   node scripts/scrape-bench.mjs --json out.json  # also dump full results
//   node --env-file=.env scripts/scrape-bench.mjs  # include the proxy fallback (WEBSHARE_PROXY_URL)
//
// Requires Node >= 23 (native TypeScript type stripping).

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const jsonIdx = args.indexOf("--json");
const jsonOut = jsonIdx >= 0 ? args.splice(jsonIdx, 2)[1] : null;
const modIdx = args.indexOf("--module");
const modulePath = modIdx >= 0 ? args.splice(modIdx, 2)[1] : resolve(here, "../src/lib/scrape.ts");
const listPath = args[0] ?? resolve(here, "scrape-bench-urls.txt");
const concurrency = 4;

const { scrapeProduct } = await import(resolve(modulePath));

const urls = readFileSync(listPath, "utf8")
  .split("\n")
  .map((l) => l.replace(/#.*$/, "").trim())
  .filter(Boolean);

async function run(url) {
  const t0 = Date.now();
  try {
    const r = await scrapeProduct(url);
    return { url, ok: true, ms: Date.now() - t0, ...r };
  } catch (e) {
    return { url, ok: false, ms: Date.now() - t0, error: e?.code ?? e?.message ?? String(e) };
  }
}

const results = new Array(urls.length);
let next = 0;
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < urls.length) {
      const i = next++;
      results[i] = await run(urls[i]);
      process.stderr.write(".");
    }
  })
);
process.stderr.write("\n");

const mark = (b) => (b ? "✓" : "✗");
const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);
console.log(`${pad("site", 26)} T P I  ${pad("price", 12)} ${pad("sources (title/price/img)", 34)} title`);
for (const r of results) {
  const host = new URL(r.url).hostname.replace(/^www\./, "");
  if (!r.ok) {
    console.log(`${pad(host, 26)} ✗ ✗ ✗  ${pad("", 12)} ${pad(r.error, 34)}`);
    continue;
  }
  const s = r.sources ?? {};
  console.log(
    `${pad(host, 26)} ${mark(r.title)} ${mark(r.price != null)} ${mark(r.imageUrl)}  ${pad(
      r.price != null ? `${r.price} ${r.currency ?? ""}` : "",
      12
    )} ${pad([s.title, s.price, s.image].map((x) => x ?? "-").join("/"), 34)} ${pad(r.title, 60)}`
  );
}

const n = results.length;
const count = (f) => results.filter(f).length;
const pct = (k) => `${k}/${n} (${Math.round((100 * k) / n)}%)`;
console.log("");
console.log(`fetched : ${pct(count((r) => r.ok))}`);
console.log(`title   : ${pct(count((r) => r.ok && r.title))}`);
console.log(`price   : ${pct(count((r) => r.ok && r.price != null))}`);
console.log(`image   : ${pct(count((r) => r.ok && r.imageUrl))}`);
console.log(`all 3   : ${pct(count((r) => r.ok && r.title && r.price != null && r.imageUrl))}`);

if (jsonOut) writeFileSync(jsonOut, JSON.stringify(results, null, 2));
