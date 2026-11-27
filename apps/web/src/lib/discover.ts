import { prisma } from "@/lib/prisma";

/** Budget buckets shown as chips (euros, upper bound exclusive). */
export const BUDGETS = {
  "moins-de-20": { label: "Moins de 20 €", min: 0, max: 20 },
  "20-50": { label: "20 à 50 €", min: 20, max: 50 },
  "50-100": { label: "50 à 100 €", min: 50, max: 100 },
  "plus-de-100": { label: "Plus de 100 €", min: 100, max: 1_000_000 },
} as const;
export type BudgetKey = keyof typeof BUDGETS;

export const isBudget = (v: unknown): v is BudgetKey => typeof v === "string" && v in BUDGETS;

export type DiscoverItem = {
  id: string;
  title: string;
  url: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  price: number | null;
  /** How many public lists wish for this product lately. */
  popularity: number;
};

/** Normalise a product URL so the same product from several lists counts once. */
function productKey(url: string | null, title: string) {
  if (!url) return `t:${title.trim().toLowerCase()}`;
  try {
    const u = new URL(url);
    return `u:${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return `t:${title.trim().toLowerCase()}`;
  }
}

/**
 * Gift ideas: products recently added to public lists, the most wished-for first.
 * Anonymous by design: no list, no owner, nothing about reservations. Optionally filtered by budget,
 * and without the given user's own wishes / people they blocked.
 */
export async function discover({
  budget,
  excludeUserIds = [],
  limit = 40,
  days = 60,
}: { budget?: BudgetKey; excludeUserIds?: string[]; limit?: number; days?: number } = {}): Promise<DiscoverItem[]> {
  const range = budget ? BUDGETS[budget] : null;
  const rows = await prisma.wish.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - days * 86_400_000) },
      imageUrl: { not: null },
      collection: { isPublic: true, ...(excludeUserIds.length && { userId: { notIn: excludeUserIds } }) },
      ...(range && { price: { gte: range.min, lt: range.max } }),
    },
    orderBy: { createdAt: "desc" },
    take: 1500,
    select: { id: true, title: true, url: true, imageUrl: true, imageWidth: true, imageHeight: true, price: true },
  });

  const byProduct = new Map<string, DiscoverItem>();
  for (const w of rows) {
    const key = productKey(w.url, w.title);
    const hit = byProduct.get(key);
    if (hit) hit.popularity++;
    else byProduct.set(key, { ...w, popularity: 1 });
  }
  // Most wished first; ties keep recency (insertion order).
  return [...byProduct.values()].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}
