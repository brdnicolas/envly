import { prisma } from "@/lib/prisma";
import { OG_SIZE, ogImage, renderOg } from "@/lib/og/render";

export const alt = "Profil Envly";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = await prisma.user.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: {
      name: true,
      image: true,
      collections: {
        where: { isPublic: true },
        select: { wishes: { where: { imageUrl: { not: null } }, select: { imageUrl: true }, take: 2 } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      },
    },
  });
  const name = u?.name ?? "Envly";
  const lists = u?.collections.length ?? 0;
  const avatar = ogImage(u?.image, 220, 220) ?? (u?.image?.includes("googleusercontent.com") ? u.image.replace(/=s\d+-c$/, "=s400-c") : null);
  const strip = (u?.collections ?? []).flatMap((c) => c.wishes).map((w) => ogImage(w.imageUrl, 200, 200)).filter((x): x is string => !!x).slice(0, 5);

  return renderOg(
    <>
      <div style={{ position: "absolute", left: 64, top: 160, display: "flex", alignItems: "center", gap: 36 }}>
        {avatar ? (
           
          <img src={avatar} width={170} height={170} alt="" style={{ borderRadius: 999, objectFit: "cover", border: "4px solid #27272a" }} />
        ) : (
          <div style={{ width: 170, height: 170, borderRadius: 999, background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, fontWeight: 700 }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -3 }}>{name}</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#a1a1aa", marginTop: 8 }}>
            {lists > 0 ? `${lists} liste${lists > 1 ? "s" : ""} d’envies sur Envly` : "Sur Envly"}
          </div>
        </div>
      </div>
      {strip.length > 0 && (
        <div style={{ position: "absolute", left: 64, bottom: 110, display: "flex", gap: 14 }}>
          {strip.map((s, i) => (
             
            <img key={i} src={s} width={150} height={150} alt="" style={{ borderRadius: 22, objectFit: "cover" }} />
          ))}
        </div>
      )}
    </>
  );
}
