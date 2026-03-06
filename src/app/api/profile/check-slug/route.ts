import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.toLowerCase().replace(/[^a-z0-9-]/g, "");

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.user.findUnique({ where: { slug } });
  const available = !existing || (!!session?.user?.id && existing.id === session.user.id);

  return NextResponse.json({ available });
}
