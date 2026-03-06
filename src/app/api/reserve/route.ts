import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const reservation = await prisma.reservation.create({
    data: { wishId, reservedBy },
  });

  return NextResponse.json(reservation);
}

export async function DELETE(req: Request) {
  const { wishId } = await req.json();

  if (!wishId) {
    return NextResponse.json({ error: "wishId is required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { wishId },
  });

  if (!reservation) {
    return NextResponse.json({ error: "No reservation found" }, { status: 404 });
  }

  await prisma.reservation.delete({ where: { id: reservation.id } });

  return NextResponse.json({ success: true });
}
