import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getCollectionAccess } from "@/lib/collection-access";

/** All my wishes across my own lists (for importing into another list). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wishes = await prisma.wish.findMany({
    where: { collection: { userId: session.user.id } },
    select: {
      id: true,
      title: true,
      url: true,
      imageUrl: true,
      price: true,
      isPriority: true,
      collectionId: true,
      collection: { select: { name: true } },
    },
    orderBy: [{ isPriority: "desc" }, { createdAt: "desc" }],
    take: 500,
  });
  return NextResponse.json(wishes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, url, description, imageUrl, price, collectionId } = await req.json();

  if (!title || !collectionId) {
    return NextResponse.json({ error: "Title and collection are required" }, { status: 400 });
  }

  const role = await getCollectionAccess(collectionId, session.user.id);

  if (role === "none") {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  let finalImageUrl = imageUrl || null;
  let imageOriginalUrl: string | null = null;

  if (imageUrl) {
    const cdnUrl = await uploadToCloudinary(imageUrl);
    if (cdnUrl) {
      finalImageUrl = cdnUrl;
      imageOriginalUrl = imageUrl;
    }
  }

  const [wish] = await prisma.$transaction([
    prisma.wish.create({
      data: {
        title,
        url,
        description,
        imageUrl: finalImageUrl,
        imageOriginalUrl,
        price: price ? parseFloat(price) : null,
        collectionId,
        creatorId: session.user.id,
      },
    }),
    prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(wish);
}
