import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blockedIds } from "@/lib/blocks";

const FEED_SIZE = 30;
const FRESH_DAYS = 7;

/**
 * Everything the "Amis" screen needs in one request:
 * - `people`: who I follow, with their public lists/wishes count and when they last added something,
 *   most recently active first (drives the avatar row and its "new" dots).
 * - `feed`: the latest wishes added to my friends' public lists.
 * Only public lists are exposed. Reservations are never sent: the feed is for browsing, not reserving.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hidden = await blockedIds(me);
  const follows = (
    await prisma.userFollow.findMany({
      where: { followerId: me },
      select: { following: { select: { id: true, name: true, image: true, slug: true } } },
    })
  ).filter((f) => !hidden.has(f.following.id));
  const ids = follows.map((f) => f.following.id);
  if (ids.length === 0) return NextResponse.json({ people: [], feed: [] });

  const publicOf = { userId: { in: ids }, isPublic: true };

  const [lists, wishCounts, latest, feed] = await Promise.all([
    prisma.collection.groupBy({ by: ["userId"], where: publicOf, _count: { _all: true } }),
    prisma.wish.findMany({ where: { collection: publicOf }, select: { collection: { select: { userId: true } } } }),
    prisma.wish.groupBy({
      by: ["collectionId"],
      where: { collection: publicOf },
      _max: { createdAt: true },
    }),
    prisma.wish.findMany({
      where: { collection: publicOf },
      orderBy: { createdAt: "desc" },
      take: FEED_SIZE,
      select: {
        id: true,
        title: true,
        url: true,
        imageUrl: true,
        imageWidth: true,
        imageHeight: true,
        price: true,
        createdAt: true,
        collection: { select: { id: true, name: true, user: { select: { id: true, name: true, image: true } } } },
      },
    }),
  ]);

  // Last activity per user: latest wish across their public lists.
  const collectionOwner = new Map(
    (await prisma.collection.findMany({ where: publicOf, select: { id: true, userId: true } })).map((c) => [c.id, c.userId])
  );
  const lastAdded = new Map<string, Date>();
  for (const l of latest) {
    const uid = collectionOwner.get(l.collectionId);
    const at = l._max.createdAt;
    if (uid && at && (!lastAdded.get(uid) || at > lastAdded.get(uid)!)) lastAdded.set(uid, at);
  }
  const wishesByUser = new Map<string, number>();
  for (const w of wishCounts) wishesByUser.set(w.collection.userId, (wishesByUser.get(w.collection.userId) ?? 0) + 1);
  const listsByUser = new Map(lists.map((l) => [l.userId, l._count._all]));

  const freshSince = Date.now() - FRESH_DAYS * 86_400_000;
  const people = follows
    .map(({ following: u }) => {
      const at = lastAdded.get(u.id) ?? null;
      return {
        ...u,
        listCount: listsByUser.get(u.id) ?? 0,
        wishCount: wishesByUser.get(u.id) ?? 0,
        lastAddedAt: at,
        hasNew: !!at && at.getTime() > freshSince,
      };
    })
    .sort((a, b) => (b.lastAddedAt?.getTime() ?? 0) - (a.lastAddedAt?.getTime() ?? 0));

  return NextResponse.json({
    people,
    feed: feed.map(({ collection, ...w }) => ({
      ...w,
      collection: { id: collection.id, name: collection.name },
      owner: collection.user,
    })),
  });
}
