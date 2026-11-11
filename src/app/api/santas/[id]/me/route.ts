import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, loadSanta, ownsCollection, serializeSanta } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ id: string }> };

/** My participation: pick the list I share, and/or accept an invitation. */
export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const member = await prisma.secretSantaMember.findUnique({
    where: { santaId_userId: { santaId: id, userId } },
    include: { santa: { select: { status: true } } },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.status === "INVITED" && member.santa.status !== "OPEN") {
    return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });
  }
  if (body.collectionId !== undefined && !(await ownsCollection(userId, body.collectionId))) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 400 });
  }

  await prisma.secretSantaMember.update({
    where: { id: member.id },
    data: {
      status: "JOINED",
      ...(body.collectionId !== undefined && { collectionId: body.collectionId || null }),
    },
  });
  return NextResponse.json(serializeSanta((await loadSanta(id))!, userId));
}

/** Leave (or decline an invitation) — only before the draw. The organizer deletes instead. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const santa = await prisma.secretSanta.findUnique({ where: { id }, select: { status: true, organizerId: true } });
  if (!santa) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (santa.organizerId === userId) {
    return NextResponse.json({ error: "L'organisateur ne peut pas quitter, il peut annuler" }, { status: 409 });
  }
  if (santa.status !== "OPEN") return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });
  await prisma.secretSantaMember.deleteMany({ where: { santaId: id, userId } });
  return NextResponse.json({ ok: true });
}
