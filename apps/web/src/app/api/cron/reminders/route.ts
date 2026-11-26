import { NextResponse } from "next/server";
import { parisDay } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

export const maxDuration = 60;

/** Days before the occasion when friends get a reminder. */
const LEADS = [14, 3];

/**
 * Daily (Vercel Cron, see vercel.json): remind people of upcoming occasions of those they follow.
 * - Birthdays (day + month on the profile) → the person's followers.
 * - Lists with an event date → their followers, plus the owner's followers when the list is public.
 * Blocked users never hear about each other.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sent = 0;
  for (const lead of LEADS) {
    const day = parisDay(lead);
    const when = lead === 14 ? "dans 2 semaines" : `dans ${lead} jours`;

    // Birthdays. On non-leap years, 29 February birthdays are celebrated on 1 March.
    const month = day.getUTCMonth() + 1;
    const date = day.getUTCDate();
    const isLeap = new Date(Date.UTC(day.getUTCFullYear(), 1, 29)).getUTCMonth() === 1;
    const days = month === 3 && date === 1 && !isLeap ? [{ birthdayMonth: 3, birthdayDay: 1 }, { birthdayMonth: 2, birthdayDay: 29 }] : [{ birthdayMonth: month, birthdayDay: date }];
    const birthdays = await prisma.user.findMany({
      where: { OR: days },
      select: { id: true, name: true, followers: { select: { followerId: true } } },
    });
    for (const u of birthdays) {
      const to = await notBlocked(u.id, u.followers.map((f) => f.followerId));
      if (!to.length) continue;
      await sendPush(to, {
        title: "Anniversaire 🎂",
        body: `L'anniversaire de ${u.name ?? "votre ami"} est ${when}. Jetez un œil à ses envies !`,
        url: `/user/${u.id}`,
      });
      sent += to.length;
    }

    // Lists with an event on that day.
    const start = new Date(day.getTime() - 12 * 3600_000);
    const end = new Date(day.getTime() + 12 * 3600_000);
    const lists = await prisma.collection.findMany({
      where: { eventDate: { gte: start, lt: end }, wishes: { some: {} } },
      select: {
        id: true,
        name: true,
        isPublic: true,
        userId: true,
        user: { select: { name: true, followers: { select: { followerId: true } } } },
        followers: { select: { userId: true } },
      },
    });
    for (const c of lists) {
      const ids = new Set(c.followers.map((f) => f.userId));
      if (c.isPublic) c.user.followers.forEach((f) => ids.add(f.followerId));
      ids.delete(c.userId);
      const to = await notBlocked(c.userId, [...ids]);
      if (!to.length) continue;
      await sendPush(to, {
        title: `${c.name} 🎁`,
        body: `C'est ${when} ! Réservez un cadeau sur la liste de ${c.user.name ?? "votre ami"}.`,
        url: `/collection/${c.id}`,
      });
      sent += to.length;
    }
  }

  return NextResponse.json({ ok: true, sent });
}

async function notBlocked(ownerId: string, userIds: string[]) {
  if (!userIds.length) return [];
  const blocks = await prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: ownerId, blockedId: { in: userIds } },
        { blockedId: ownerId, blockerId: { in: userIds } },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
  const hidden = new Set(blocks.map((b) => (b.blockerId === ownerId ? b.blockedId : b.blockerId)));
  return userIds.filter((id) => !hidden.has(id));
}
