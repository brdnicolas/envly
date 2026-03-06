import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const follow = await prisma.userFollow.create({
    data: {
      followerId: session.user.id,
      followingId: userId,
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "NEW_FOLLOWER",
      data: {
        followerId: session.user.id,
        followerName: session.user.name || "Quelqu'un",
      },
    },
  });

  return NextResponse.json(follow);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  await prisma.userFollow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: userId,
    },
  });

  return NextResponse.json({ success: true });
}
