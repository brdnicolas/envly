import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, loadSanta, serializeSanta } from "@/lib/secret-santa";
import { nanoid } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

/** Create my own private list for this Secret Santa and share it there. */
export async function POST(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.secretSantaMember.findUnique({
    where: { santaId_userId: { santaId: id, userId } },
    include: { santa: { select: { name: true } } },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const collection = await prisma.collection.create({
    data: {
      name: `🎅 ${member.santa.name}`.slice(0, 80),
      description: "Ma liste pour le Secret Santa",
      slug: nanoid(10),
      isPublic: false, // only my Secret Santa can open it
      userId,
    },
    select: { id: true, name: true },
  });
  await prisma.secretSantaMember.update({
    where: { id: member.id },
    data: { collectionId: collection.id, status: "JOINED" },
  });
  return NextResponse.json({ collection, santa: serializeSanta((await loadSanta(id))!, userId) }, { status: 201 });
}
