import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const collaborators = await prisma.collectionCollaborator.findMany({
    where: { collectionId: id },
    include: {
      user: { select: { id: true, name: true, image: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(collaborators);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { userId: true, name: true },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check that the owner follows this user
  const follows = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: userId,
      },
    },
  });

  if (!follows) {
    return NextResponse.json({ error: "You can only invite users you follow" }, { status: 403 });
  }

  // Check if already invited
  const existing = await prisma.collectionCollaborator.findUnique({
    where: { collectionId_userId: { collectionId: id, userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "User already invited" }, { status: 409 });
  }

  const collaborator = await prisma.collectionCollaborator.create({
    data: { collectionId: id, userId },
    include: {
      user: { select: { id: true, name: true, image: true, slug: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "COLLABORATION_INVITE",
      data: {
        collectionId: id,
        collectionName: collection.name,
        collaboratorId: collaborator.id,
        invitedBy: session.user.id,
        invitedByName: session.user.name || "Quelqu'un",
      },
    },
  });

  return NextResponse.json(collaborator);
}
