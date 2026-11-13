import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { isBlockedBetween } from "@/lib/blocks";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  if (await isBlockedBetween(session.user.id, userId)) {
    return NextResponse.json({ error: "Blocked" }, { status: 403 });
  }

  // Following twice is a no-op (and must not notify twice).
  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
  });
  if (existing) return NextResponse.json(existing);

  const follow = await prisma.userFollow.create({
    data: {
      followerId: session.user.id,
      followingId: userId,
    },
  });

  const followerName = session.user.name || "Quelqu'un";
  await prisma.notification.create({
    data: {
      userId,
      type: "NEW_FOLLOWER",
      data: {
        followerId: session.user.id,
        followerName,
      },
    },
  });

  // Push: tapping it opens the follower's profile in the app, with "Suivre en retour" one tap away.
  const me = session.user.id;
  const followsBack = await prisma.userFollow.count({ where: { followerId: userId, followingId: me } });
  after(() =>
    sendPush([userId], {
      title: followsBack ? `${followerName} vous suit aussi` : `${followerName} vous suit`,
      body: followsBack ? "Vous êtes maintenant amis sur Envly." : "Touchez pour suivre en retour et voir ses envies.",
      url: `/user/${me}`,
    })
  );

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
