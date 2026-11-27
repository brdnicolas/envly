import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { currentUserId } from "@/lib/secret-santa";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Anonymous Q&A of a drawn Secret Santa. Each member has up to two threads:
 * - `recipient`: with the person I give to (I am the giver, they don't know it's me);
 * - `santa`: with my own Secret Santa (I am the recipient, I never learn who they are).
 * Messages carry no author id, only `mine`.
 */
async function context(santaId: string, userId: string) {
  const santa = await prisma.secretSanta.findUnique({
    where: { id: santaId },
    select: {
      id: true,
      name: true,
      status: true,
      members: { where: { status: "JOINED" }, select: { userId: true, giftToId: true } },
    },
  });
  if (!santa || santa.status !== "DRAWN") return null;
  const me = santa.members.find((m) => m.userId === userId);
  if (!me) return null;
  const mySanta = santa.members.find((m) => m.giftToId === userId);
  return { santa, recipientId: me.giftToId, santaId: mySanta?.userId ?? null };
}

function shape(messages: { id: string; body: string; fromGiver: boolean; createdAt: Date }[], iAmGiver: boolean) {
  return messages.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, mine: m.fromGiver === iAmGiver }));
}

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await context((await params).id, userId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [recipient, santa] = await Promise.all([
    ctx.recipientId
      ? prisma.secretSantaMessage.findMany({
          where: { santaId: ctx.santa.id, giverId: userId, recipientId: ctx.recipientId },
          orderBy: { createdAt: "asc" },
          take: 200,
        })
      : [],
    ctx.santaId
      ? prisma.secretSantaMessage.findMany({
          where: { santaId: ctx.santa.id, giverId: ctx.santaId, recipientId: userId },
          orderBy: { createdAt: "asc" },
          take: 200,
        })
      : [],
  ]);
  return NextResponse.json({ recipient: shape(recipient, true), santa: shape(santa, false) });
}

/** body: { thread: "recipient" | "santa", body: string } */
export async function POST(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await context((await params).id, userId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const input = await req.json().catch(() => ({}));
  const text = typeof input.body === "string" ? input.body.trim().slice(0, 500) : "";
  if (!text) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const asGiver = input.thread === "recipient";
  const giverId = asGiver ? userId : ctx.santaId;
  const recipientId = asGiver ? ctx.recipientId : userId;
  if (!giverId || !recipientId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Light flood guard: a few dozen messages per thread is plenty for gift questions.
  const count = await prisma.secretSantaMessage.count({ where: { santaId: ctx.santa.id, giverId, recipientId } });
  if (count >= 200) return NextResponse.json({ error: "Trop de messages dans cette conversation" }, { status: 429 });

  const message = await prisma.secretSantaMessage.create({
    data: { santaId: ctx.santa.id, giverId, recipientId, fromGiver: asGiver, body: text },
  });

  const url = `/santa/chat?id=${ctx.santa.id}&thread=${asGiver ? "santa" : "recipient"}`;
  after(async () => {
    if (asGiver) {
      await sendPush([recipientId], {
        title: `${ctx.santa.name} 🎁`,
        body: `Votre Secret Santa vous pose une question : « ${text.slice(0, 80)} »`,
        url,
      });
    } else {
      const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await sendPush([giverId], {
        title: `${ctx.santa.name} 🎁`,
        body: `${me?.name ?? "La personne à qui vous offrez"} a répondu : « ${text.slice(0, 80)} »`,
        url,
      });
    }
  });

  return NextResponse.json(shape([message], asGiver)[0], { status: 201 });
}
