import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, loadSanta, serializeSanta } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ id: string; userId: string }> };

/** Organizer removes someone (or withdraws an invitation) before the draw. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const me = await currentUserId();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, userId } = await params;
  const santa = await prisma.secretSanta.findUnique({ where: { id }, select: { organizerId: true, status: true } });
  if (!santa || santa.organizerId !== me) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (santa.status !== "OPEN") return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });
  if (userId === me) return NextResponse.json({ error: "Impossible de se retirer soi-même" }, { status: 400 });
  await prisma.secretSantaMember.deleteMany({ where: { santaId: id, userId } });
  return NextResponse.json(serializeSanta((await loadSanta(id))!, me));
}
