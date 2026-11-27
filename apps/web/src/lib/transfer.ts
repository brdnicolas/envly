/**
 * Data portability: export my lists (JSON / CSV) and import lists from a file
 * (an Envly export, or a CSV / JSON exported from another wishlist app).
 */

export type ImportedWish = { title: string; url: string | null; price: number | null; description: string | null; imageUrl: string | null; isPriority: boolean };
export type ImportedList = { name: string; description: string | null; wishes: ImportedWish[] };

export const IMPORT_LIMITS = { lists: 50, wishesPerList: 300, wishes: 2000 };

export const CSV_COLUMNS = ["liste", "titre", "lien", "prix", "description", "prioritaire", "image"] as const;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** RFC 4180 CSV, delimiter guessed between "," and ";" (French Excel). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: unknown[][]) {
  // BOM so Excel opens accents correctly.
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------------------
// Flexible field mapping (Envly, Listy-like and generic exports)
// ---------------------------------------------------------------------------

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

const ALIASES: Record<keyof ImportedWish | "list", string[]> = {
  list: ["liste", "list", "listname", "nomdelaliste", "collection", "wishlist", "categorie", "category", "board"],
  title: ["titre", "title", "nom", "name", "article", "item", "produit", "product", "souhait", "wish", "envie", "cadeau", "gift"],
  url: ["lien", "link", "url", "producturl", "adresse", "website", "site"],
  price: ["prix", "price", "montant", "amount", "cost", "cout"],
  description: ["description", "note", "notes", "commentaire", "comment", "details", "detail", "taille", "size"],
  isPriority: ["prioritaire", "ispriority", "priority", "favori", "favorite", "favourite", "important", "star"],
  imageUrl: ["image", "imageurl", "photo", "picture", "img", "thumbnail"],
};

function fieldOf(header: string): keyof typeof ALIASES | null {
  const h = norm(header);
  for (const [field, names] of Object.entries(ALIASES)) if (names.includes(h)) return field as keyof typeof ALIASES;
  return null;
}

function parsePrice(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  if (typeof v !== "string") return null;
  const m = v.replace(/\s/g, "").replace(",", ".").match(/\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? Math.round(n * 100) / 100 : null;
}

function parseUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Images hosted by the source wishlist service are not copied: only merchant images. */
function parseImage(v: unknown): string | null {
  const url = parseUrl(v);
  if (!url) return null;
  return /(^|\.)listy\./i.test(new URL(url).hostname) ? null : url;
}

const truthy = (v: unknown) => v === true || (typeof v === "string" && /^(1|true|oui|yes|x|vrai|★|\*)$/i.test(v.trim()));
const text = (v: unknown, max: number) => (typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) || null : null);

function toWish(r: Partial<Record<keyof typeof ALIASES, unknown>>): ImportedWish | null {
  const url = parseUrl(r.url);
  const title = text(r.title, 200) ?? (url ? new URL(url).hostname.replace(/^www\./, "") : null);
  if (!title) return null;
  return {
    title,
    url,
    price: parsePrice(r.price),
    description: text(r.description, 1000),
    imageUrl: parseImage(r.imageUrl),
    isPriority: truthy(r.isPriority),
  };
}

function group(rows: { list: string; wish: ImportedWish }[], fallbackName: string): ImportedList[] {
  const lists = new Map<string, ImportedList>();
  for (const { list, wish } of rows) {
    const name = list || fallbackName;
    if (!lists.has(name)) lists.set(name, { name: name.slice(0, 80), description: null, wishes: [] });
    lists.get(name)!.wishes.push(wish);
  }
  return [...lists.values()];
}

/** CSV with a header row; unknown columns are ignored. */
export function listsFromCsv(content: string, fallbackName: string): ImportedList[] {
  const [header, ...body] = parseCsv(content);
  if (!header) return [];
  const fields = header.map(fieldOf);
  if (!fields.includes("title") && !fields.includes("url")) {
    throw new Error("Colonnes introuvables : il faut au moins une colonne « titre » ou « lien ».");
  }
  const rows: { list: string; wish: ImportedWish }[] = [];
  for (const cells of body) {
    const rec: Partial<Record<keyof typeof ALIASES, unknown>> = {};
    fields.forEach((f, i) => {
      if (f && rec[f] === undefined) rec[f] = cells[i];
    });
    const wish = toWish(rec);
    if (wish) rows.push({ list: text(rec.list, 80) ?? "", wish });
  }
  return group(rows, fallbackName);
}

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => !!v && typeof v === "object" && !Array.isArray(v);

/** Map an object's keys through the aliases (first match wins). */
function remap(o: Rec) {
  const out: Partial<Record<keyof typeof ALIASES, unknown>> = {};
  for (const [k, v] of Object.entries(o)) {
    const f = fieldOf(k);
    if (f && out[f] === undefined) out[f] = v;
  }
  return out;
}

/**
 * JSON: an Envly export `{ lists: [{ name, wishes: [...] }] }`, any `[{ name, items|wishes|products: [...] }]`,
 * or a flat array of items with a list column.
 */
export function listsFromJson(content: string, fallbackName: string): ImportedList[] {
  let data: unknown;
  try {
    data = JSON.parse(content.replace(/^﻿/, ""));
  } catch {
    throw new Error("Fichier JSON invalide.");
  }
  if (isRec(data)) data = data.lists ?? data.collections ?? data.wishlists ?? data.items ?? data.wishes ?? [data];
  if (!Array.isArray(data)) return [];

  const nested = data.filter(isRec).filter((l) => ["wishes", "items", "products", "gifts", "souhaits"].some((k) => Array.isArray(l[k])));
  if (nested.length) {
    return nested.map((l) => {
      const items = (["wishes", "items", "products", "gifts", "souhaits"].map((k) => l[k]).find(Array.isArray) ?? []) as unknown[];
      const meta = remap(l);
      return {
        name: (text(l.name, 80) ?? text(l.title, 80) ?? text(meta.list, 80) ?? fallbackName) as string,
        description: text(l.description, 500),
        wishes: items.filter(isRec).map((i) => toWish(remap(i))).filter((w): w is ImportedWish => !!w),
      };
    });
  }
  const rows = data.filter(isRec).map((o) => {
    const r = remap(o);
    return { list: text(r.list, 80) ?? "", wish: toWish(r) };
  });
  return group(rows.filter((r): r is { list: string; wish: ImportedWish } => !!r.wish), fallbackName);
}

/** Parse an uploaded file by name / content, then enforce the limits. */
export function parseImport(filename: string, content: string): ImportedList[] {
  const fallback = "Liste importée";
  const isJson = /\.json$/i.test(filename) || /^\s*[[{]/.test(content.replace(/^﻿/, ""));
  const lists = (isJson ? listsFromJson(content, fallback) : listsFromCsv(content, fallback)).filter((l) => l.wishes.length);
  let budget = IMPORT_LIMITS.wishes;
  return lists.slice(0, IMPORT_LIMITS.lists).map((l) => {
    const wishes = l.wishes.slice(0, Math.min(IMPORT_LIMITS.wishesPerList, budget));
    budget -= wishes.length;
    return { ...l, wishes };
  }).filter((l) => l.wishes.length);
}
