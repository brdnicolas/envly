import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { getCollectionAccess } from "@/lib/collection-access";

async function canModifyWish(wishId: string, userId: string) {
  const wish = await prisma.wish.findUnique({
    where: { id: wishId },
    include: { collection: { select: { userId: true } } },
  });

  if (!wish) return { allowed: false, wish: null } as const;

  const role = await getCollectionAccess(wish.collectionId, userId);

  if (role === "owner") return { allowed: true, wish } as const;
  if (role === "collaborator" && wish.creatorId === userId) return { allowed: true, wish } as const;

  return { allowed: false, wish: null } as const;
}

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

  const { allowed, wish } = await canModifyWish(id, session.user.id);

  if (!allowed || !wish) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.wish.update({
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
    }),
    prisma.collection.update({
      where: { id: wish.collectionId },
      data: { updatedAt: new Date() },
    }),
  ]);

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

  const { allowed, wish } = await canModifyWish(id, session.user.id);

  if (!allowed || !wish) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.wish.delete({ where: { id } }),
    prisma.collection.update({
      where: { id: wish.collectionId },
      data: { updatedAt: new Date() },
    }),
  ]);

  if (wish.imageUrl?.includes("cloudinary")) {
    deleteFromCloudinary(wish.imageUrl);
  }

  return NextResponse.json({ success: true });
}
