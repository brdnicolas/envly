#!/usr/bin/env node
// Demo data for App Store / Play Store screenshots and for the reviewers' test account.
//
//   yarn workspace @envly/web db:seed-demo
//
// Creates 3 fictional users (Camille = the demo account, plus her friends Jules and Inès), their public lists,
// follows, a reservation and a drawn Secret Santa. Re-runnable: the 3 demo users are deleted first (cascade),
// nothing else in the database is touched. Product photos are reused from existing Cloudinary uploads.
// The demo password is written to demo-account.local.txt at the repo root (git-ignored).

import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import pg from "pg";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL?.replace("-pooler.", ".");
if (!url) throw new Error("DATABASE_URL is not set (run with --env-file=.env)");

const id = () => "demo" + randomBytes(10).toString("hex");
const ago = (hours) => new Date(Date.now() - hours * 3600_000);

const DEMO_EMAIL = "demo@envly.fr";
const USERS = {
  camille: { email: DEMO_EMAIL, name: "Camille Durand", slug: "camille", description: "Déco, cuisine et bons parfums ✨" },
  jules: { email: "jules.demo@envly.fr", name: "Jules Moreau", slug: "jules-moreau", description: "Vinyles, micro et jeux de société 🎧" },
  ines: { email: "ines.demo@envly.fr", name: "Inès Laurent", slug: "ines-laurent", description: "Toujours entre deux randos ⛰️" },
};

// [owner, list name, hours since last update, [ [match in an existing wish title, demo title], … ]]
const LISTS = [
  ["camille", "🏡 Maison", 30, [
    ["Churros Bougeoir", "Bougeoir Churros, bleu cobalt"],
    ["Wide Cross Lamp", "Lampe Wide Cross 01"],
    ["THE MINI WAVY Shelf", "Étagère Mini Wavy"],
    ["Klekks No. 11", "Plaid en laine Klekks"],
    ["Bouquet De Fleurs", "Bouquet de fleurs séchées"],
    ["Cadre photo fait main Rift", "Cadre photo Rift"],
  ]],
  ["camille", "🍰 Cuisine", 70, [
    ["1L - KETTLE STUDIO - Bouilloire", "Bouilloire Kettle Studio 1 L"],
    ["CAST AMBER jug", "Carafe Cast ambre 1,2 L"],
    ["SEPIA tumbler", "Verre Sepia 370 ml"],
    ["Hay Miz", "Bouteille Hay Miz 720 ml"],
    ["Seia - Dessous de verre pêche", "Dessous de verre Seia, pêche"],
  ]],
  ["camille", "🎂 Mon anniversaire", 120, [
    ["This Is Her!", "Zadig & Voltaire This Is Her!"],
    ["Bianco Latte", "Bianco Latte, eau de parfum"],
    ["Design: The Definitive Visual History", "Design: The Definitive Visual History"],
    ["Thinking with Type", "Thinking with Type"],
    ["TINYL Play Pro", "Platine vinyle Tinyl Play Pro"],
  ]],
  ["jules", "🎧 Musique & setup", 3, [
    ["Depression Cherry", "Beach House, Depression Cherry (vinyle)"],
    ["Shure SM7B", "Micro Shure SM7B"],
    ["Cigarettes After Sex", "Cigarettes After Sex (vinyle)"],
    ["Philips Hue Play HDMI", "Philips Hue Play Sync Box"],
    ["Oh Shit!", "Oh Sh*t!, jeu de cartes"],
  ]],
  ["ines", "⛰️ Rando", 9, [
    ["Aerios", "Sac à dos Aerios 35"],
    ["Lampe frontale rechargeable", "Lampe frontale 600 lumens"],
    ["Gourde Filtrante Katadyn", "Gourde filtrante Katadyn BeFree"],
    ["Veste Kyanite", "Veste Kyanite"],
  ]],
  ["ines", "🎲 Jeux de société", 26, [
    ["Présages", "Présages"],
    ["Mille Sabords", "Mille Sabords"],
    ["Vérone - Ferti", "Vérone"],
  ]],
];

const db = new pg.Client({ connectionString: url });
await db.connect();
try {
  await db.query("BEGIN");

  // Product photos to reuse (any existing wish with a measured Cloudinary image).
  const { rows: photos } = await db.query(
    `select title, url, price, "imageUrl", "imageWidth", "imageHeight" from "Wish"
     where "imageUrl" like 'https://res.cloudinary.com/%' and "imageWidth" is not null`
  );
  const photo = (match) => {
    const p = photos.find((w) => w.title.includes(match));
    if (!p) throw new Error(`No existing photo for "${match}"`);
    return p;
  };

  // Start clean (cascades to their lists, wishes, follows, santas…).
  await db.query(`delete from "User" where email = any($1)`, [Object.values(USERS).map((u) => u.email)]);

  const password = randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(password, 10);
  const userId = {};
  for (const [key, u] of Object.entries(USERS)) {
    userId[key] = id();
    await db.query(
      `insert into "User" (id, name, email, "emailVerified", slug, description, password, "createdAt")
       values ($1, $2, $3, now(), $4, $5, $6, $7)`,
      [userId[key], u.name, u.email, u.slug, u.description, key === "camille" ? hash : null, ago(24 * 60)]
    );
  }

  const listId = {};
  for (const [owner, name, hours, items] of LISTS) {
    const cid = id();
    listId[name] = cid;
    const slug = `${USERS[owner].slug}-${name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase()}-${randomBytes(2).toString("hex")}`;
    await db.query(
      `insert into "Collection" (id, name, slug, "isPublic", "userId", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $5, $5)`,
      [cid, name, slug, userId[owner], ago(hours)]
    );
    for (const [i, [match, title]] of items.entries()) {
      const p = photo(match);
      await db.query(
        `insert into "Wish" (id, title, url, "imageUrl", "imageWidth", "imageHeight", price, position, "isPriority", "collectionId", "creatorId", "createdAt", "updatedAt")
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
        [id(), title, p.url, p.imageUrl, p.imageWidth, p.imageHeight, p.price, i, i === 0, cid, userId[owner], ago(hours + i * 5)]
      );
    }
  }

  // Everyone follows each other.
  for (const a of Object.keys(USERS))
    for (const b of Object.keys(USERS))
      if (a !== b) await db.query(`insert into "UserFollow" (id, "followerId", "followingId", "createdAt") values ($1, $2, $3, $4)`, [id(), userId[a], userId[b], ago(24 * 30)]);

  // Camille already reserved Jules's microphone.
  const { rows: [mic] } = await db.query(`select id from "Wish" where "collectionId" = $1 and title like 'Micro%'`, [listId["🎧 Musique & setup"]]);
  await db.query(`insert into "Reservation" (id, "wishId", "reservedBy", token, "createdAt") values ($1, $2, 'Camille', $3, now())`, [id(), mic.id, randomBytes(16).toString("hex")]);

  // A drawn Secret Santa: Camille → Jules → Inès → Camille.
  const santa = id();
  await db.query(
    `insert into "SecretSanta" (id, name, budget, date, "inviteCode", status, "organizerId", "drawnAt", "createdAt")
     values ($1, '🎄 Noël entre amis', 30, '2026-12-24', $2, 'DRAWN', $3, now(), $4)`,
    [santa, "DEMO" + randomBytes(3).toString("hex").toUpperCase(), userId.camille, ago(48)]
  );
  const members = [
    ["camille", "🎂 Mon anniversaire", "jules"],
    ["jules", "🎧 Musique & setup", "ines"],
    ["ines", "⛰️ Rando", "camille"],
  ];
  for (const [who, list, giftTo] of members)
    await db.query(
      `insert into "SecretSantaMember" (id, "santaId", "userId", status, "collectionId", "giftToId", "createdAt") values ($1, $2, $3, 'JOINED', $4, $5, $6)`,
      [id(), santa, userId[who], listId[list], userId[giftTo], ago(40)]
    );

  await db.query("COMMIT");

  const file = new URL("../../../demo-account.local.txt", import.meta.url);
  writeFileSync(file, `Envly demo account (App Review / screenshots)\nemail: ${DEMO_EMAIL}\npassword: ${password}\n`);
  console.log(`✓ Demo data created. Credentials saved in demo-account.local.txt (git-ignored).`);
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
