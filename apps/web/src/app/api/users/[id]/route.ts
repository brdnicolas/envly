import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Public profile of a user (by id or slug), for the app's profile screen.
 * Only public lists are returned; follow state is relative to the signed-in user.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const me = session?.user?.id ?? null;

  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    select: {
      id: true,
      name: true,
      image: true,
      slug: true,
      description: true,
      _count: { select: { followers: true, following: true } },
      collections: {
        where: { isPublic: true },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          isPublic: true,
          _count: { select: { wishes: true } },
          wishes: {
            where: { imageUrl: { not: null } },
            select: { imageUrl: true },
            orderBy: [{ isPriority: "desc" }, { createdAt: "desc" }],
            take: 6,
          },
        },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [iBlocked, blockedMe] =
    me && me !== user.id
      ? await Promise.all([
          prisma.userBlock.count({ where: { blockerId: me, blockedId: user.id } }),
          prisma.userBlock.count({ where: { blockerId: user.id, blockedId: me } }),
        ])
      : [0, 0];
  if (blockedMe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [isFollowing, followsMe] = me && me !== user.id
    ? await Promise.all([
        prisma.userFollow.count({ where: { followerId: me, followingId: user.id } }),
        prisma.userFollow.count({ where: { followerId: user.id, followingId: me } }),
      ])
    : [0, 0];

  const { _count, collections, ...profile } = user;
  return NextResponse.json({
    ...profile,
    isBlocked: iBlocked > 0,
    isMe: me === user.id,
    isFollowing: isFollowing > 0,
    followsMe: followsMe > 0,
    followersCount: _count.followers,
    followingCount: _count.following,
    wishCount: iBlocked ? 0 : collections.reduce((n, c) => n + c._count.wishes, 0),
    collections: iBlocked ? [] : collections,
  });
}
