import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const wish = await prisma.wish.findUnique({
    where: { id },
    include: { collection: true },
  });

  if (!wish || wish.collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.wish.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.price !== undefined && { price: body.price ? parseFloat(body.price) : null }),
      ...(body.isPriority !== undefined && { isPriority: body.isPriority }),
      ...(body.collectionId !== undefined && { collectionId: body.collectionId }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const wish = await prisma.wish.findUnique({
    where: { id },
    include: { collection: true },
  });

  if (!wish || wish.collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.wish.delete({ where: { id } });

  if (wish.imageUrl?.includes("cloudinary")) {
    deleteFromCloudinary(wish.imageUrl);
  }

  return NextResponse.json({ success: true });
}
