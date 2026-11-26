import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollectionAccess } from "@/lib/collection-access";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

/**
 * Owner thanks whoever offered a received gift. The owner never learns who it was:
 * the note is stored on the reservation and delivered to the reserver (push + in-app notification).
 * body: { message: string }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const wish = await prisma.wish.findUnique({
    where: { id },
    select: { id: true, title: true, receivedAt: true, collectionId: true, reservation: true },
  });
  if (!wish || (await getCollectionAccess(wish.collectionId, session.user.id)) !== "owner") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Only once the gift arrived: before that, asking would spoil the surprise.
  if (!wish.receivedAt) return NextResponse.json({ error: "Marquez d'abord ce cadeau comme reçu" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
  if (!message) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const r = wish.reservation;
  if (!r) {
    return NextResponse.json(
      { error: "Ce cadeau n'a pas été réservé sur Envly : remerciez la personne directement 😊" },
      { status: 404 }
    );
  }
  if (!r.reserverId) {
    return NextResponse.json(
      { error: "La personne a réservé sans compte Envly : impossible de lui transmettre votre message." },
      { status: 409 }
    );
  }

  await prisma.reservation.update({ where: { id: r.id }, data: { thanks: message, thankedAt: new Date() } });

  const reserverId = r.reserverId;
  const fromName = session.user.name ?? "Votre ami";
  after(async () => {
    await prisma.notification.create({
      data: { userId: reserverId, type: "THANKS", data: { fromName, wishTitle: wish.title, message } },
    });
    await sendPush([reserverId], {
      title: `${fromName} vous dit merci 💛`,
      body: `« ${message.slice(0, 100)} » — pour ${wish.title}`,
    });
  });

  return NextResponse.json({ ok: true });
}
