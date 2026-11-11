import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EXPO_TOKEN = /^Expo(nent)?PushToken\[[^\]]+\]$/;

/** Register this device's Expo push token for the signed-in user. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, platform } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || !EXPO_TOKEN.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  // A device belongs to whoever is signed in on it now.
  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform: String(platform ?? "unknown").slice(0, 16), userId: session.user.id },
    update: { userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}

/** Sign-out: stop sending to this device. */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { token } = await req.json().catch(() => ({}));
  if (typeof token === "string") {
    await prisma.pushToken.deleteMany({ where: { token, userId: session.user.id } });
  }
  return NextResponse.json({ ok: true });
}
