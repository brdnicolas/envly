import { randomInt } from "crypto";
import { getServerSession } from "next-auth";
import { after } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { nanoid } from "@/lib/utils";

/** Everything needed to render a Secret Santa for one member. */
export const santaInclude = {
  organizer: { select: { id: true, name: true, image: true } },
  members: {
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, name: true, image: true } },
      collection: { select: { id: true, name: true, isPublic: true, slug: true } },
    },
  },
};

type SantaWithMembers = NonNullable<
  Awaited<ReturnType<typeof prisma.secretSanta.findUnique<{ where: { id: string }; include: typeof santaInclude }>>>
>;

/**
 * Shape sent to `userId`. Secrecy rule: the only pairing ever serialised is
 * the viewer's own (`assignment`); other members never carry `giftToId`.
 */
export function serializeSanta(santa: SantaWithMembers, userId: string) {
  const me = santa.members.find((m) => m.userId === userId);
  const giftTo = me?.giftToId ? santa.members.find((m) => m.userId === me.giftToId) : undefined;

  return {
    id: santa.id,
    name: santa.name,
    budget: santa.budget,
    date: santa.date,
    status: santa.status,
    inviteCode: santa.inviteCode,
    isOrganizer: santa.organizerId === userId,
    organizer: santa.organizer,
    // Only the organizer manages (and sees) who must not draw whom.
    exclusions: santa.organizerId === userId ? parseExclusions(santa.exclusions) : [],
    me: me
      ? { status: me.status, collection: me.collection ? { id: me.collection.id, name: me.collection.name } : null }
      : null,
    members: santa.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      status: m.status,
      hasList: !!m.collectionId,
    })),
    assignment:
      santa.status === "DRAWN" && giftTo
        ? {
            user: giftTo.user,
            collection: giftTo.collection
              ? {
                  id: giftTo.collection.id,
                  name: giftTo.collection.name,
                  // Public lists also have a web page; private ones open in the app.
                  slug: giftTo.collection.isPublic ? giftTo.collection.slug : null,
                }
              : null,
          }
        : null,
  };
}

export async function loadSanta(id: string) {
  return prisma.secretSanta.findUnique({ where: { id }, include: santaInclude });
}

export function newInviteCode() {
  return nanoid(12);
}

/** The collection must belong to the user (it is shown to their Secret Santa). */
export async function ownsCollection(userId: string, collectionId: string | null | undefined) {
  if (!collectionId) return true;
  const c = await prisma.collection.findUnique({ where: { id: collectionId }, select: { userId: true } });
  return c?.userId === userId;
}

export type Exclusion = [string, string];

/** Exclusion pairs stored as JSON: keep only well-formed [a, b] pairs of distinct strings. */
export function parseExclusions(v: unknown): Exclusion[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: Exclusion[] = [];
  for (const p of v) {
    if (!Array.isArray(p) || p.length !== 2) continue;
    const [a, b] = p;
    if (typeof a !== "string" || typeof b !== "string" || a === b) continue;
    const key = [a, b].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([a, b]);
  }
  return out.slice(0, 100);
}

/**
 * One single cycle over a random order (A→B→C→…→A): nobody draws themselves
 * and no two people simply swap gifts. Excluded pairs (either direction) are never
 * neighbours in the cycle. Returns null when no valid cycle was found.
 */
export function drawCycle(userIds: string[], exclusions: Exclusion[] = []): Map<string, string> | null {
  const banned = new Set(exclusions.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]));
  const order = [...userIds];
  // Rejection sampling: cheap for the group sizes we have (a few dozen people at most).
  for (let attempt = 0; attempt < 5000; attempt++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.every((giver, i) => !banned.has(`${giver}>${order[(i + 1) % order.length]}`))) {
      const pairs = new Map<string, string>();
      order.forEach((giver, i) => pairs.set(giver, order[(i + 1) % order.length]));
      return pairs;
    }
  }
  return null;
}

/**
 * Can `viewerId` read collection `collectionId` because they are its owner's Secret Santa?
 * True when, in a drawn Secret Santa, the owner shared that list and the viewer gives to the owner.
 */
export async function isSantaOfCollection(viewerId: string, collectionId: string) {
  const shared = await prisma.secretSantaMember.findMany({
    where: { collectionId, santa: { status: "DRAWN" } },
    select: { santaId: true, userId: true },
  });
  if (!shared.length) return false;
  const giver = await prisma.secretSantaMember.findFirst({
    where: { userId: viewerId, OR: shared.map((s) => ({ santaId: s.santaId, giftToId: s.userId })) },
    select: { id: true },
  });
  return !!giver;
}

/** Signed-in user id, or null. */
export async function currentUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * Invite people directly: only those connected to the organizer (either follow direction).
 * Strangers join through the link instead. Already-present members are left untouched.
 */
export async function inviteConnections(santaId: string, organizerId: string, userIds: unknown) {
  const requested = Array.isArray(userIds)
    ? userIds.filter((x): x is string => typeof x === "string" && x !== organizerId).slice(0, 50)
    : [];
  if (!requested.length) return [];
  const connected = await prisma.userFollow.findMany({
    where: {
      OR: [
        { followerId: organizerId, followingId: { in: requested } },
        { followingId: organizerId, followerId: { in: requested } },
      ],
    },
    select: { followerId: true, followingId: true },
  });
  const allowed = new Set(connected.map((f) => (f.followerId === organizerId ? f.followingId : f.followerId)));
  const already = await prisma.secretSantaMember.findMany({
    where: { santaId, userId: { in: [...allowed] } },
    select: { userId: true },
  });
  const fresh = [...allowed].filter((id) => !already.some((m) => m.userId === id));
  await prisma.secretSantaMember.createMany({
    data: fresh.map((userId) => ({ santaId, userId, status: "INVITED" as const })),
    skipDuplicates: true,
  });
  return fresh;
}

/** "X vous invite au Secret Santa « … »" to the newly invited people (after the response is sent). */
export function notifyInvited(santa: { id: string; name: string }, organizerName: string | null | undefined, userIds: string[]) {
  if (!userIds.length) return;
  after(() =>
    sendPush(userIds, {
      title: "Secret Santa 🎁",
      body: `${organizerName ?? "Un ami"} vous invite au Secret Santa « ${santa.name} »`,
      url: `/santa/${santa.id}`,
    })
  );
}

/** "Le tirage a eu lieu" to every participant. */
export function notifyDrawn(santa: { id: string; name: string }, userIds: string[]) {
  after(() =>
    sendPush(userIds, {
      title: `${santa.name} 🎁`,
      body: "Le tirage a eu lieu ! Découvrez à qui vous offrez.",
      url: `/santa/${santa.id}`,
    })
  );
}
