import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "@/lib/utils";
import { parseImport } from "@/lib/transfer";

export const maxDuration = 60;

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Import lists from a file the user exported (Envly JSON/CSV, or another app's CSV/JSON export).
 * multipart/form-data: `file`, and `preview=1` to only parse and return a summary.
 * Lists are created private; nothing is fetched from the source service.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Fichier trop volumineux (2 Mo max)" }, { status: 400 });

  let lists;
  try {
    lists = parseImport(file.name, await file.text());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fichier illisible" }, { status: 400 });
  }
  if (!lists.length) return NextResponse.json({ error: "Aucun article trouvé dans ce fichier" }, { status: 400 });

  const summary = lists.map((l) => ({ name: l.name, count: l.wishes.length }));
  if (form?.get("preview")) return NextResponse.json({ preview: true, lists: summary });

  const created = await prisma.$transaction(
    async (tx) => {
      const out: { id: string; name: string; count: number }[] = [];
      for (const l of lists) {
        const base = l.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "liste";
        const c = await tx.collection.create({
          data: { name: l.name, description: l.description, slug: `${base}-${nanoid(6)}`, isPublic: false, userId },
          select: { id: true, name: true },
        });
        await tx.wish.createMany({
          data: l.wishes.map((w, i) => ({
            title: w.title,
            url: w.url,
            price: w.price,
            description: w.description,
            imageUrl: w.imageUrl,
            imageOriginalUrl: w.imageUrl,
            isPriority: w.isPriority,
            position: i,
            collectionId: c.id,
            creatorId: userId,
          })),
        });
        out.push({ ...c, count: l.wishes.length });
      }
      return out;
    },
    { timeout: 30_000 }
  );

  return NextResponse.json({ lists: created, wishes: created.reduce((n, l) => n + l.count, 0) }, { status: 201 });
}
