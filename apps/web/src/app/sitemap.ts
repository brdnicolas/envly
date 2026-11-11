import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/extension`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/install`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/signin`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Public lists (with something in them) and the profiles that own them.
  const [lists, users] = await Promise.all([
    prisma.collection.findMany({
      where: { isPublic: true, wishes: { some: {} } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    }),
    prisma.user.findMany({
      where: { slug: { not: null }, collections: { some: { isPublic: true, wishes: { some: {} } } } },
      select: { slug: true, createdAt: true },
      take: 5000,
    }),
  ]);

  return [
    ...statics,
    ...lists.map((l) => ({ url: `${SITE_URL}/w/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...users.map((u) => ({ url: `${SITE_URL}/u/${u.slug}`, lastModified: u.createdAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
