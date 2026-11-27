import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blockedIds } from "@/lib/blocks";
import { parisDay } from "@/lib/events";

const FEED_SIZE = 30;
const FRESH_DAYS = 7;
/** Occasions shown ahead in "À venir". */
const UPCOMING_DAYS = 45;

/**
 * Everything the "Amis" screen needs in one request:
 * - `people`: who I follow, with their public lists/wishes count and when they last added something,
 *   most recently active first (drives the avatar row and its "new" dots).
 * - `feed`: the latest wishes added to my friends' public lists.
 * - `upcoming`: friends' birthdays and dated public lists in the next weeks, soonest first.
 * - `newLists`: public lists my friends created lately.
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
  if (ids.length === 0) return NextResponse.json({ people: [], feed: [], upcoming: [], newLists: [] });

  const publicOf = { userId: { in: ids }, isPublic: true };

  const today = parisDay();
  const horizon = new Date(today.getTime() + UPCOMING_DAYS * 86_400_000);
  const [birthdays, events, newLists] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids }, birthdayDay: { not: null }, birthdayMonth: { not: null } },
      select: { id: true, name: true, image: true, slug: true, birthdayDay: true, birthdayMonth: true },
    }),
    prisma.collection.findMany({
      where: { ...publicOf, eventDate: { gte: new Date(today.getTime() - 12 * 3600_000), lte: horizon } },
      select: { id: true, name: true, eventDate: true, user: { select: { id: true, name: true, image: true } } },
      orderBy: { eventDate: "asc" },
      take: 20,
    }),
    prisma.collection.findMany({
      where: { ...publicOf, createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) }, wishes: { some: {} } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { wishes: true } },
        wishes: { where: { imageUrl: { not: null } }, select: { imageUrl: true }, take: 4 },
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const upcoming = [
    ...birthdays.map((u) => {
      const date = nextOccurrence(u.birthdayDay!, u.birthdayMonth!, today);
      return { kind: "birthday" as const, date, user: { id: u.id, name: u.name, image: u.image, slug: u.slug }, collection: null };
    }),
    ...events.map((c) => ({ kind: "event" as const, date: c.eventDate!, user: c.user, collection: { id: c.id, name: c.name } })),
  ]
    .filter((e) => e.date.getTime() <= horizon.getTime())
    .map((e) => ({ ...e, days: Math.round((e.date.getTime() - today.getTime()) / 86_400_000) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 12);

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
    upcoming,
    newLists: newLists.map(({ user, ...c }) => ({ ...c, owner: user })),
    feed: feed.map(({ collection, ...w }) => ({
      ...w,
      collection: { id: collection.id, name: collection.name },
      owner: collection.user,
    })),
  });
}

/** Next birthday on or after `today` (UTC-noon dates); 29 Feb falls on 1 Mar in other years. */
function nextOccurrence(day: number, month: number, today: Date) {
  const at = (y: number) => {
    const d = new Date(Date.UTC(y, month - 1, day, 12));
    return d.getUTCMonth() === month - 1 ? d : new Date(Date.UTC(y, 2, 1, 12));
  };
  const y = today.getUTCFullYear();
  const thisYear = at(y);
  return thisYear.getTime() >= today.getTime() ? thisYear : at(y + 1);
}
