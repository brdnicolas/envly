import { prisma } from "@/lib/prisma";

/** True if either user blocked the other. */
export async function isBlockedBetween(a: string, b: string) {
  if (a === b) return false;
  const n = await prisma.userBlock.count({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return n > 0;
}

/** Everyone `userId` blocked or was blocked by: hidden from each other in search, feed and profiles. */
export async function blockedIds(userId: string) {
  const rows = await prisma.userBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  return new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)));
}
