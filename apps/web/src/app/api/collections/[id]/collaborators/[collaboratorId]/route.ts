import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, collaboratorId } = await params;
  const { status } = await req.json();

  if (!["ACCEPTED", "DECLINED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const collaborator = await prisma.collectionCollaborator.findUnique({
    where: { id: collaboratorId, collectionId: id },
  });

  if (!collaborator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the invited user can accept/decline
  if (collaborator.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (collaborator.status !== "PENDING") {
    return NextResponse.json({ error: "Already responded" }, { status: 400 });
  }

  const updated = await prisma.collectionCollaborator.update({
    where: { id: collaboratorId },
    data: { status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, collaboratorId } = await params;

  const collaborator = await prisma.collectionCollaborator.findUnique({
    where: { id: collaboratorId, collectionId: id },
    include: { collection: { select: { userId: true } } },
  });

  if (!collaborator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Owner can remove anyone, collaborator can only remove themselves
  const isOwner = collaborator.collection.userId === session.user.id;
  const isSelf = collaborator.userId === session.user.id;

  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.collectionCollaborator.delete({ where: { id: collaboratorId } });

  return NextResponse.json({ success: true });
}
