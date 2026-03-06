import { NextResponse } from "next/server";
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

  const existing = await prisma.reservation.findUnique({
    where: { wishId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "This wish is already reserved" },
      { status: 400 }
    );
  }

  const token = nanoid(16);

  const reservation = await prisma.reservation.create({
    data: { wishId, reservedBy, token },
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
