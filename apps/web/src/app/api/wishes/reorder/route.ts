import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderedIds, collectionId } = await req.json();

  if (!Array.isArray(orderedIds) || !collectionId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the collection belongs to the user
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update all positions in a transaction
  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.wish.update({
        where: { id },
        data: { position: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}
