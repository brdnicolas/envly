import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeBirthday } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { CSV_COLUMNS, toCsv } from "@/lib/transfer";

/**
 * Download my data (RGPD portability): my profile and my own lists with their wishes.
 * ?format=json (default, re-importable on Envly) or ?format=csv (one row per wish, for Excel).
 * Reservations are left out: they are other people's data, and would spoil the surprise.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      slug: true,
      description: true,
      birthdayDay: true,
      birthdayMonth: true,
      createdAt: true,
      collections: {
        orderBy: { createdAt: "asc" },
        select: {
          name: true,
          description: true,
          isPublic: true,
          eventDate: true,
          slug: true,
          createdAt: true,
          wishes: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: { title: true, url: true, price: true, description: true, isPriority: true, imageUrl: true, receivedAt: true, createdAt: true },
          },
        },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    const rows: unknown[][] = [[...CSV_COLUMNS]];
    for (const c of user.collections) {
      for (const w of c.wishes) rows.push([c.name, w.title, w.url, w.price, w.description, w.isPriority ? "oui" : "", w.imageUrl]);
    }
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="envly-listes-${stamp}.csv"`,
      },
    });
  }

  const { birthdayDay, birthdayMonth, collections, ...profile } = user;
  const body = {
    format: "envly-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: { ...profile, birthday: serializeBirthday({ birthdayDay, birthdayMonth }) },
    lists: collections,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="envly-export-${stamp}.json"`,
    },
  });
}
