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
  const tab = searchParams.get("tab") || "following";

  if (tab === "stats") {
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: session.user.id } }),
      prisma.userFollow.count({ where: { followerId: session.user.id } }),
    ]);
    return NextResponse.json({ followersCount, followingCount });
  }

  if (tab === "friends-collections") {
    // Get all public collections from users I follow
    const following = await prisma.userFollow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json([]);
    }

    const collections = await prisma.collection.findMany({
      where: {
        userId: { in: followingIds },
        isPublic: true,
      },
      include: {
        user: { select: { id: true, name: true, image: true, slug: true } },
        _count: { select: { wishes: true } },
        wishes: {
          where: { imageUrl: { not: null } },
          select: { imageUrl: true },
          take: 6,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        slug: c.slug,
        isPublic: c.isPublic,
        owner: {
          id: c.user.id,
          name: c.user.name,
          image: c.user.image,
          slug: c.user.slug,
        },
        _count: c._count,
        wishes: c.wishes,
      }))
    );
  }

  if (tab === "followers") {
    const followers = await prisma.userFollow.findMany({
      where: { followingId: session.user.id },
      include: {
        follower: {
          select: { id: true, name: true, image: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const followerIds = followers.map((f) => f.follower.id);
    const followBacks = await prisma.userFollow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });
    const followBackSet = new Set(followBacks.map((f) => f.followingId));

    return NextResponse.json(
      followers.map((f) => ({
        ...f.follower,
        isFollowing: followBackSet.has(f.follower.id),
      }))
    );
  }

  if (tab === "collections") {
    const follows = await prisma.collectionFollow.findMany({
      where: { userId: session.user.id },
      include: {
        collection: {
          include: {
            user: { select: { name: true } },
            _count: { select: { wishes: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      follows.map((f) => ({
        id: f.collection.id,
        name: f.collection.name,
        description: f.collection.description,
        slug: f.collection.slug,
        ownerName: f.collection.user.name,
        wishCount: f.collection._count.wishes,
      }))
    );
  }

  // Default: following
  const following = await prisma.userFollow.findMany({
    where: { followerId: session.user.id },
    include: {
      following: {
        select: { id: true, name: true, image: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    following.map((f) => ({ ...f.following, isFollowing: true }))
  );
}
