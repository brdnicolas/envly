import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Copy some of my wishes (from any of my lists) into this list. Duplicates (same link or title) are skipped. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const target = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true, wishes: { select: { url: true, title: true, position: true } } },
  });
  if (!target || target.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const wishIds: string[] = Array.isArray(body.wishIds) ? body.wishIds.filter((x: unknown) => typeof x === "string").slice(0, 100) : [];
  const sources = await prisma.wish.findMany({
    where: { id: { in: wishIds }, collection: { userId }, NOT: { collectionId: id } },
    select: { title: true, url: true, description: true, imageUrl: true, imageOriginalUrl: true, price: true },
  });

  const seen = new Set(target.wishes.flatMap((w) => [w.url, w.title].filter(Boolean) as string[]));
  let position = target.wishes.reduce((max, w) => Math.max(max, w.position), 0);
  const fresh = sources.filter((w) => !seen.has(w.url ?? "") && !seen.has(w.title));

  await prisma.wish.createMany({
    data: fresh.map((w) => ({ ...w, collectionId: id, creatorId: userId, position: ++position })),
  });
  await prisma.collection.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ imported: fresh.length, skipped: sources.length - fresh.length });
}
