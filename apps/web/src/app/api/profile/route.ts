import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseBirthday, serializeBirthday } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { nanoid } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, description: true, slug: true, birthdayDay: true, birthdayMonth: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { birthdayDay, birthdayMonth, ...rest } = user;
  return NextResponse.json({ ...rest, birthday: serializeBirthday({ birthdayDay, birthdayMonth }) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Auto-generate slug if requesting one and user doesn't have one
  if (body.generateSlug) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, slug: true },
    });

    if (user?.slug) {
      return NextResponse.json({ slug: user.slug });
    }

    const baseName = (user?.name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseName}-${nanoid(6)}`;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { slug },
      select: { slug: true },
    });

    return NextResponse.json(updated);
  }

  // Custom vanity slug
  if (body.slug !== undefined) {
    const slug = body.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "")
      .replace(/^-|-$/g, "");

    if (slug.length < 3) {
      return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 });
    }
    if (slug.length > 30) {
      return NextResponse.json({ error: "Slug must be 30 characters or less" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { slug } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "This link is already taken" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { slug },
      select: { slug: true },
    });
    return NextResponse.json(updated);
  }

  const data: Record<string, string | number | null> = {};
  if (body.name !== undefined) data.name = body.name || null;
  if (body.image !== undefined) data.image = body.image || null;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.birthday !== undefined) {
    const b = parseBirthday(body.birthday);
    if (!b) return NextResponse.json({ error: "Date d'anniversaire invalide" }, { status: 400 });
    Object.assign(data, b);
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, image: true, description: true, slug: true, birthdayDay: true, birthdayMonth: true },
  });
  const { birthdayDay, birthdayMonth, ...rest } = updated;
  return NextResponse.json({ ...rest, birthday: serializeBirthday({ birthdayDay, birthdayMonth }) });
}
