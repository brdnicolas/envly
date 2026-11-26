import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollectionAccess } from "@/lib/collection-access";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { nanoid } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Group gift on a wish: friends pledge an amount, like an anonymous reservation shared by several people.
 * Owners and collaborators can neither contribute nor see contributions (the surprise stays intact).
 */
async function loadWish(id: string) {
  return prisma.wish.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      price: true,
      receivedAt: true,
      collectionId: true,
      collection: { select: { isPublic: true } },
      reservation: { select: { id: true } },
      contributions: { select: { id: true, name: true, amount: true, contributorId: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

const shape = (cs: { id: string; name: string; amount: number }[]) => cs.map(({ id, name, amount }) => ({ id, name, amount }));

/** body: { name: string, amount: number } → { id, token, contributions } */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const wish = await loadWish(id);
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  if (!wish.collection.isPublic && !userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (userId && (await getCollectionAccess(wish.collectionId, userId)) !== "none") {
    return NextResponse.json({ error: "Vous ne pouvez pas participer à votre propre liste" }, { status: 403 });
  }
  if (wish.receivedAt) return NextResponse.json({ error: "Ce cadeau a déjà été offert" }, { status: 400 });
  if (wish.reservation) return NextResponse.json({ error: "Ce cadeau est déjà réservé par quelqu'un" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!name) return NextResponse.json({ error: "Votre nom est requis" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (wish.contributions.length >= 50) return NextResponse.json({ error: "Trop de participants" }, { status: 400 });

  const token = nanoid(16);
  const created = await prisma.contribution.create({
    data: { wishId: id, name, amount, token, contributorId: userId },
    select: { id: true, name: true, amount: true },
  });
  const all = [...wish.contributions, created];

  // Tell the other signed-in participants, so they can coordinate the purchase.
  const others = [...new Set(wish.contributions.map((c) => c.contributorId).filter((u): u is string => !!u && u !== userId))];
  if (others.length) {
    const total = all.reduce((n, c) => n + c.amount, 0);
    const progress = wish.price ? ` (${Math.round(total)} / ${Math.round(wish.price)} €)` : "";
    after(() =>
      sendPush(others, {
        title: "Cadeau à plusieurs 🎁",
        body: `${name} participe aussi à « ${wish.title} »${progress}`,
      })
    );
  }

  return NextResponse.json({ id: created.id, token, contributions: shape(all) }, { status: 201 });
}

/** body: { contributionId, token } → withdraw my pledge. */
export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const c = typeof body.contributionId === "string"
    ? await prisma.contribution.findUnique({ where: { id: body.contributionId } })
    : null;
  if (!c || c.wishId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (c.token !== body.token) return NextResponse.json({ error: "Vous ne pouvez retirer que votre participation" }, { status: 403 });
  await prisma.contribution.delete({ where: { id: c.id } });
  const rest = await prisma.contribution.findMany({
    where: { wishId: id },
    select: { id: true, name: true, amount: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ contributions: rest });
}
