import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { wishes: true } },
      wishes: {
        where: { imageUrl: { not: null } },
        select: { imageUrl: true },
        take: 6,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(collections);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${nanoid(6)}`;

  const collection = await prisma.collection.create({
    data: {
      name,
      description,
      slug,
      userId: session.user.id,
    },
  });

  return NextResponse.json(collection);
}
