import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, loadSanta, ownsCollection, serializeSanta } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ code: string }> };

async function byCode(code: string) {
  const s = await prisma.secretSanta.findUnique({ where: { inviteCode: code }, select: { id: true } });
  return s ? loadSanta(s.id) : null;
}

/** Preview from an invite link: who organizes, who's in, am I already in. */
export async function GET(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const santa = await byCode((await params).code);
  if (!santa) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  const joined = santa.members.some((m) => m.userId === userId && m.status === "JOINED");
  const data = serializeSanta(santa, userId);
  // Outsiders only see the essentials.
  return NextResponse.json({
    id: data.id,
    name: data.name,
    budget: data.budget,
    date: data.date,
    status: data.status,
    organizer: data.organizer,
    members: data.members.filter((m) => m.status === "JOINED").map(({ id, name, image }) => ({ id, name, image })),
    joined,
  });
}

/** Join with the list I want to share. */
export async function POST(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const santa = await byCode((await params).code);
  if (!santa) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  if (santa.status !== "OPEN") return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  if (!(await ownsCollection(userId, body.collectionId))) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 400 });
  }
  await prisma.secretSantaMember.upsert({
    where: { santaId_userId: { santaId: santa.id, userId } },
    create: { santaId: santa.id, userId, status: "JOINED", collectionId: body.collectionId || null },
    update: { status: "JOINED", ...(body.collectionId !== undefined && { collectionId: body.collectionId || null }) },
  });
  return NextResponse.json(serializeSanta((await loadSanta(santa.id))!, userId));
}
