import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createMobileToken, MOBILE_TOKEN_MAX_AGE } from "@/lib/mobile-token";

// Mobile sign-in with email/password: returns a NextAuth-compatible JWT.
// The app sends it back as `Authorization: Bearer <token>`; the middleware
// turns that into the session cookie so every existing API route works as-is.
// Google sign-in goes through ./authorize instead.

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).trim() } });

  if (!user || !user.password || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    token: await createMobileToken(user),
    expiresIn: MOBILE_TOKEN_MAX_AGE,
    user: { id: user.id, email: user.email, name: user.name, image: user.image, slug: user.slug },
  });
}
