import { prisma } from "@/lib/prisma";
import { OG_SIZE, ogImage, renderOg } from "@/lib/og/render";

export const alt = "Liste d’envies sur Envly";
export const size = OG_SIZE;
export const contentType = "image/png";

/** "🎂 Mes 30 ans · liste de Camille" with a mosaic of the first products. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.collection.findUnique({
    where: { slug },
    select: {
      name: true,
      isPublic: true,
      user: { select: { name: true } },
      _count: { select: { wishes: true } },
      wishes: {
        where: { imageUrl: { not: null } },
        orderBy: [{ isPriority: "desc" }, { createdAt: "desc" }],
        select: { imageUrl: true },
        take: 12,
      },
    },
  });

  const name = c?.isPublic ? c.name : "Une liste d’envies";
  const owner = c?.isPublic ? (c.user.name ?? "Quelqu’un") : null;
  const imgs = (c?.isPublic ? c.wishes : []).map((w) => ogImage(w.imageUrl, 360, 360)).filter((u): u is string => !!u).slice(0, 4);
  const count = c?.isPublic ? c._count.wishes : 0;

  return renderOg(
    <>
      <div style={{ position: "absolute", left: 64, top: 170, width: imgs.length ? 540 : 1000, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 26, fontWeight: 500, color: "#a1a1aa" }}>{owner ? `La liste d’envies de ${owner}` : "Liste d’envies"}</div>
        <div style={{ marginTop: 14, fontSize: name.length > 22 ? 64 : 80, fontWeight: 800, letterSpacing: -3, lineHeight: 1.02 }}>{name}</div>
        {count > 0 && (
          <div style={{ marginTop: 26, display: "flex", fontSize: 26, fontWeight: 500, color: "#d4d4d8" }}>
            {count} souhait{count > 1 ? "s" : ""} · réservez-en un en secret
          </div>
        )}
      </div>
      {imgs.length > 0 && (
        <div style={{ position: "absolute", left: 646, top: 70, width: 490, height: 490, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {imgs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              width={imgs.length === 1 ? 490 : 240}
              height={imgs.length <= 2 ? 490 : 240}
              style={{ borderRadius: 26, objectFit: "cover", background: "#fff" }}
            />
          ))}
        </div>
      )}
    </>
  );
}
