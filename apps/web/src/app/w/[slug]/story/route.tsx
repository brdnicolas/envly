import { ImageResponse } from "next/og";
import { GOLD, load, ogImage } from "@/lib/og/render";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

export const revalidate = 600;

const W = 1080;
const H = 1920;

/**
 * Instagram / WhatsApp story image of a public list (1080×1920): name, owner,
 * a grid of products and the short link to share. Private lists get a generic card.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await prisma.collection.findUnique({
    where: { slug },
    select: {
      name: true,
      isPublic: true,
      eventDate: true,
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
  const pub = !!c?.isPublic;
  const name = pub ? c!.name : "Ma liste d’envies";
  const owner = pub ? (c!.user.name ?? null) : null;
  const imgs = (pub ? c!.wishes : []).map((w) => ogImage(w.imageUrl, 440, 440)).filter((u): u is string => !!u).slice(0, 6);
  const count = pub ? c!._count.wishes : 0;
  const date = pub && c!.eventDate ? c!.eventDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" }) : null;
  const link = `${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}/w/${slug}`;
  const { fonts, star } = await load();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Geist",
          color: "#f4f4f5",
          background: "radial-gradient(90% 60% at 80% 0%, #3d3322 0%, #0b0b0c 65%)",
          padding: "120px 80px 110px",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={star} width={56} height={56} alt="" />
          <span style={{ fontSize: 46, fontWeight: 700, letterSpacing: -1 }}>Envly</span>
        </div>

        <div style={{ marginTop: 90, fontSize: 38, fontWeight: 500, color: "#a1a1aa", display: "flex" }}>
          {owner ? `La liste d’envies de ${owner}` : "Liste d’envies"}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: name.length > 18 ? 92 : 116,
            fontWeight: 800,
            letterSpacing: -4,
            lineHeight: 1.02,
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
          }}>
          {name}
        </div>
        {(date || count > 0) && (
          <div style={{ marginTop: 30, fontSize: 36, fontWeight: 500, color: GOLD, display: "flex" }}>
            {[date, count ? `${count} envie${count > 1 ? "s" : ""}` : null].filter(Boolean).join(" · ")}
          </div>
        )}

        <div style={{ marginTop: 80, width: 920, display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
          {imgs.length ? (
            imgs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="" width={imgs.length <= 2 ? 450 : 293} height={imgs.length <= 2 ? 450 : 293} style={{ borderRadius: 36, objectFit: "cover", background: "#fff" }} />
            ))
          ) : (
            <div style={{ fontSize: 160, display: "flex" }}>🎁</div>
          )}
        </div>

        <div style={{ flex: 1, display: "flex" }} />
        <div style={{ fontSize: 40, fontWeight: 700, display: "flex" }}>Réservez un cadeau en secret</div>
        <div
          style={{
            marginTop: 26,
            padding: "22px 40px",
            borderRadius: 999,
            background: "#f4f4f5",
            color: "#0b0b0c",
            fontSize: 36,
            fontWeight: 700,
            display: "flex",
          }}>
          {link}
        </div>
      </div>
    ),
    { width: W, height: H, fonts, headers: { "Cache-Control": "public, max-age=600, s-maxage=600" } }
  );
}
