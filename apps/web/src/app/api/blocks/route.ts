import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** People I blocked (Compte → Utilisateurs bloqués). */
export async function GET() {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.userBlock.findMany({
    where: { blockerId: me },
    orderBy: { createdAt: "desc" },
    select: { blocked: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(rows.map((r) => r.blocked));
}

/** Block someone: both follows are removed and they can't follow me back or see me in the app. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await req.json().catch(() => ({}));
  if (typeof userId !== "string" || !userId || userId === me) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: me, blockedId: userId } },
      create: { blockerId: me, blockedId: userId },
      update: {},
    }),
    prisma.userFollow.deleteMany({
      where: { OR: [{ followerId: me, followingId: userId }, { followerId: userId, followingId: me }] },
    }),
  ]);
  return NextResponse.json({ blocked: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await req.json().catch(() => ({}));
  if (typeof userId !== "string" || !userId) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  await prisma.userBlock.deleteMany({ where: { blockerId: me, blockedId: userId } });
  return NextResponse.json({ blocked: false });
}
