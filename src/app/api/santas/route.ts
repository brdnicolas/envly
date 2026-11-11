import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, inviteConnections, loadSanta, notifyInvited, newInviteCode, ownsCollection, santaInclude, serializeSanta } from "@/lib/secret-santa";

/** The Secret Santas I take part in, or am invited to (newest first). Over a week past their date, they drop off. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const santas = await prisma.secretSanta.findMany({
    where: {
      members: { some: { userId } },
      OR: [{ date: null }, { date: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }],
    },
    include: santaInclude,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(santas.map((s) => serializeSanta(s, userId)));
}

/** Create one; the organizer joins it right away (optionally with a list). */
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  const budget = Number.isFinite(body.budget) && body.budget > 0 ? Math.round(body.budget) : null;
  const date = body.date ? new Date(body.date) : null;
  if (date && Number.isNaN(date.getTime())) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  if (!(await ownsCollection(userId, body.collectionId))) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 400 });
  }

  const santa = await prisma.secretSanta.create({
    data: {
      name,
      budget,
      date,
      inviteCode: newInviteCode(),
      organizerId: userId,
      members: { create: { userId, status: "JOINED", collectionId: body.collectionId || null } },
    },
    include: santaInclude,
  });
  // Friends picked in the creation flow get their invitation right away.
  const invited = await inviteConnections(santa.id, userId, body.userIds);
  const full = (await loadSanta(santa.id))!;
  notifyInvited(full, full.organizer.name, invited);
  return NextResponse.json(serializeSanta(full, userId), { status: 201 });
}
