import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "@/lib/utils";

export async function POST(req: Request) {
  const { wishId, reservedBy } = await req.json();

  if (!wishId || !reservedBy) {
    return NextResponse.json(
      { error: "wishId and reservedBy are required" },
      { status: 400 }
    );
  }

  const [existing, wish] = await Promise.all([
    prisma.reservation.findUnique({ where: { wishId } }),
    prisma.wish.findUnique({ where: { id: wishId }, select: { receivedAt: true, _count: { select: { contributions: true } } } }),
  ]);
  if (!wish) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wish.receivedAt) {
    return NextResponse.json({ error: "Ce cadeau a déjà été offert" }, { status: 400 });
  }
  if (wish._count.contributions) {
    return NextResponse.json({ error: "Un cadeau à plusieurs est en cours : participez plutôt !" }, { status: 400 });
  }

  if (existing) {
    return NextResponse.json(
      { error: "This wish is already reserved" },
      { status: 400 }
    );
  }

  const token = nanoid(16);
  // Remember who reserved when signed in, only to deliver the owner's thank-you later.
  const session = await getServerSession(authOptions);

  const reservation = await prisma.reservation.create({
    data: { wishId, reservedBy, token, reserverId: session?.user?.id ?? null },
  });

  return NextResponse.json({ id: reservation.id, token });
}

export async function DELETE(req: Request) {
  const { wishId, token } = await req.json();

  if (!wishId || !token) {
    return NextResponse.json(
      { error: "wishId and token are required" },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservation.findUnique({
    where: { wishId },
  });

  if (!reservation) {
    return NextResponse.json({ error: "No reservation found" }, { status: 404 });
  }

  if (reservation.token !== token) {
    return NextResponse.json(
      { error: "You can only cancel your own reservation" },
      { status: 403 }
    );
  }

  await prisma.reservation.delete({ where: { id: reservation.id } });

  return NextResponse.json({ success: true });
}
