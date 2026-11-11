import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, drawCycle, loadSanta, notifyDrawn, serializeSanta } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ id: string }> };

/** Organizer draws: pending invitations are dropped, joined members get one person each. */
export async function POST(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const santa = await prisma.secretSanta.findUnique({
    where: { id },
    include: { members: { where: { status: "JOINED" }, select: { id: true, userId: true } } },
  });
  if (!santa || santa.organizerId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (santa.status !== "OPEN") return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });
  if (santa.members.length < 3) {
    return NextResponse.json({ error: "Il faut au moins 3 participants" }, { status: 400 });
  }

  const pairs = drawCycle(santa.members.map((m) => m.userId));
  const drawn = await prisma.$transaction(async (tx) => {
    // Flip the status first: a concurrent second draw finds nothing to flip and stops.
    const { count } = await tx.secretSanta.updateMany({
      where: { id, status: "OPEN" },
      data: { status: "DRAWN", drawnAt: new Date() },
    });
    if (!count) return false;
    await tx.secretSantaMember.deleteMany({ where: { santaId: id, status: "INVITED" } });
    for (const m of santa.members) {
      await tx.secretSantaMember.update({ where: { id: m.id }, data: { giftToId: pairs.get(m.userId)! } });
    }
    return true;
  });
  if (!drawn) return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });
  // Everyone but the organizer (who just did it) learns that the draw happened.
  notifyDrawn(santa, santa.members.map((m) => m.userId).filter((u) => u !== userId));
  return NextResponse.json(serializeSanta((await loadSanta(id))!, userId));
}
