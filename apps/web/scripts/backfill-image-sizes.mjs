#!/usr/bin/env node
// Fill Wish.imageWidth / imageHeight for wishes created before those columns existed.
// New wishes get their size at upload time; this only catches up the old ones. Safe to re-run.
//
//   yarn workspace @envly/web db:backfill-images            # dry run: measures, writes nothing
//   yarn workspace @envly/web db:backfill-images --write    # saves the sizes
//
// Cloudinary photos are measured with `fl_getinfo` (tiny JSON, no download);
// photos hosted by shops are downloaded once and read with sharp (repo-root dev dependency).

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import pg from "pg";

const write = process.argv.includes("--write");
const sharp = createRequire(fileURLToPath(new URL("../../../package.json", import.meta.url)))("sharp");

const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL?.replace("-pooler.", ".");
if (!url) throw new Error("DATABASE_URL is not set (run with --env-file=.env)");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

async function measure(src) {
  const m = src.match(CLOUDINARY);
  if (m) {
    const res = await fetch(`${m[1]}fl_getinfo/${m[2]}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`fl_getinfo ${res.status}`);
    const info = await res.json();
    const { width, height } = info.output ?? info.input ?? {};
    return { width, height };
  }
  const res = await fetch(src, { headers: { "user-agent": UA, accept: "image/*" }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { width, height } = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
  return { width, height };
}

const db = new pg.Client({ connectionString: url });
await db.connect();
const { rows } = await db.query(
  `select id, "imageUrl", "imageOriginalUrl" from "Wish" where "imageUrl" is not null and "imageWidth" is null`
);
console.log(`${rows.length} wishes without image size${write ? "" : " (dry run, add --write to save)"}`);

let ok = 0;
const failed = [];
const queue = [...rows];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let w; (w = queue.shift()); ) {
      let size = null;
      for (const src of [w.imageUrl, w.imageOriginalUrl].filter(Boolean)) {
        try {
          size = await measure(src);
          if (size.width && size.height) break;
        } catch (e) {
          size = null;
          w.error = e.message;
        }
      }
      if (!size?.width || !size?.height) {
        failed.push(`${w.id}  ${w.error ?? "no size"}  ${w.imageUrl.slice(0, 80)}`);
        continue;
      }
      if (write) {
        await db.query(`update "Wish" set "imageWidth" = $1, "imageHeight" = $2 where id = $3`, [size.width, size.height, w.id]);
      }
      ok++;
    }
  })
);

console.log(`✓ ${ok} measured${write ? " and saved" : ""}, ${failed.length} failed`);
if (failed.length) console.log("Failed (the browser falls back to measuring these itself):\n  " + failed.join("\n  "));
await db.end();
