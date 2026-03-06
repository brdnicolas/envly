import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collaborator = await prisma.collectionCollaborator.findUnique({
    where: { collectionId_userId: { collectionId: id, userId: session.user.id } },
  });

  if (!collaborator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.collectionCollaborator.delete({ where: { id: collaborator.id } });

  return NextResponse.json({ success: true });
}
