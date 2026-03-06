import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, url, description, imageUrl, price, collectionId } = await req.json();

  if (!title || !collectionId) {
    return NextResponse.json({ error: "Title and collection are required" }, { status: 400 });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const wish = await prisma.wish.create({
    data: { title, url, description, imageUrl, price: price ? parseFloat(price) : null, collectionId },
  });

  return NextResponse.json(wish);
}
