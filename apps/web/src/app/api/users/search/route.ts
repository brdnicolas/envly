import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: session.user.id } },
        {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      image: true,
      slug: true,
    },
    take: 10,
  });

  // Also check if current user follows each result
  const followings = await prisma.userFollow.findMany({
    where: {
      followerId: session.user.id,
      followingId: { in: users.map((u) => u.id) },
    },
    select: { followingId: true },
  });

  const followingSet = new Set(followings.map((f) => f.followingId));

  return NextResponse.json(
    users.map((u) => ({ ...u, isFollowing: followingSet.has(u.id) }))
  );
}
