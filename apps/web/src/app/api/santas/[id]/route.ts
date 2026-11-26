import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId, loadSanta, parseExclusions, serializeSanta } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const santa = await loadSanta((await params).id);
  if (!santa || !santa.members.some((m) => m.userId === userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(serializeSanta(santa, userId));
}

/** Organizer: rename, change budget, date or exclusions (pairs who must not draw each other). */
export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const santa = await prisma.secretSanta.findUnique({
    where: { id },
    select: { organizerId: true, status: true, members: { select: { userId: true } } },
  });
  if (!santa || santa.organizerId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: { name?: string; budget?: number | null; date?: Date | null; exclusions?: [string, string][] } = {};
  if (body.exclusions !== undefined) {
    if (santa.status !== "OPEN") return NextResponse.json({ error: "Le tirage a déjà eu lieu" }, { status: 409 });
    const memberIds = new Set(santa.members.map((m) => m.userId));
    data.exclusions = parseExclusions(body.exclusions).filter(([a, b]) => memberIds.has(a) && memberIds.has(b));
  }
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 80);
  if (body.budget !== undefined) data.budget = Number.isFinite(body.budget) && body.budget > 0 ? Math.round(body.budget) : null;
  if (body.date !== undefined) {
    const d = body.date ? new Date(body.date) : null;
    if (d && Number.isNaN(d.getTime())) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    data.date = d;
  }
  await prisma.secretSanta.update({ where: { id }, data });
  const updated = await loadSanta(id);
  return NextResponse.json(serializeSanta(updated!, userId));
}

/** Organizer: cancel the whole Secret Santa. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { count } = await prisma.secretSanta.deleteMany({ where: { id, organizerId: userId } });
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
