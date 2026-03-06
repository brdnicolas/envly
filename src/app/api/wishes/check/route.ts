import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ exists: false });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ exists: false });
  }

  const wish = await prisma.wish.findFirst({
    where: {
      url,
      collection: { userId: session.user.id },
    },
    select: { id: true },
  });

  return NextResponse.json({ exists: !!wish });
}
