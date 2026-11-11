import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCollectionAccess } from "@/lib/collection-access";
import { isSantaOfCollection } from "@/lib/secret-santa";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getCollectionAccess(id, session.user.id);

  // Anyone signed in may read a public collection (friends' lists in the app),
  // as a "viewer": read-only, and the only role that sees reservations.
  let role: "owner" | "collaborator" | "viewer" = "viewer";
  if (access === "none") {
    const pub = await prisma.collection.findUnique({ where: { id }, select: { isPublic: true } });
    // Private lists stay readable by the owner's Secret Santa (the list they shared for it).
    if (!pub?.isPublic && !(await isSantaOfCollection(session.user.id, id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    role = access;
  }

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true, slug: true } },
      wishes: {
        orderBy: [{ isPriority: "desc" }, { position: "asc" }, { createdAt: "desc" }],
        include: {
          creator: { select: { id: true, name: true } },
          // Surprise preserved: owners and collaborators never see who reserved what.
          ...(role === "viewer" && { reservation: { select: { reservedBy: true } } }),
        },
      },
      collaborators: {
        where: { status: "ACCEPTED" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...collection, role });
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

  const collection = await prisma.collection.findUnique({
    where: { id },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.collection.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
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

  const collection = await prisma.collection.findUnique({
    where: { id },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.collection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
