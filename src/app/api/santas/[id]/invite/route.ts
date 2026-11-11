import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, inviteConnections, loadSanta, notifyInvited, serializeSanta } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ id: string }> };

/** Organizer invites people they follow or who follow them; they accept from their home screen. */
export async function POST(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const santa = await prisma.secretSanta.findUnique({ where: { id }, select: { organizerId: true, status: true } });
  if (!santa || santa.organizerId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (santa.status !== "OPEN") return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const invited = await inviteConnections(id, userId, body.userIds);
  const full = (await loadSanta(id))!;
  notifyInvited(full, full.organizer.name, invited);
  return NextResponse.json(serializeSanta(full, userId));
}
