import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collectionId } = await req.json();
  if (!collectionId) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const follow = await prisma.collectionFollow.create({
    data: {
      userId: session.user.id,
      collectionId,
    },
  });

  return NextResponse.json(follow);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collectionId } = await req.json();
  if (!collectionId) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  await prisma.collectionFollow.deleteMany({
    where: {
      userId: session.user.id,
      collectionId,
    },
  });

  return NextResponse.json({ success: true });
}
