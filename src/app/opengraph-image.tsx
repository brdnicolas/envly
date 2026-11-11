import { GOLD, OG_SIZE, ogImage, renderOg } from "@/lib/og/render";

export const alt = "Envly : wishlists partagées, surprises préservées";
export const size = OG_SIZE;
export const contentType = "image/png";

const C = "https://res.cloudinary.com/dbe3pchfj/image/upload";
// Three real wishes, fanned out like cards on a table.
const CARDS = [
  { src: `${C}/v1775857094/envly/ipyubnzcmuloxh5n2tn9.webp`, title: "Étagère Mini Wavy", price: "143 €", left: 760, top: 120, rot: -8 },
  { src: `${C}/v1774945689/envly/xjdgph7fg5bqy8lzcs3k.webp`, title: "Plaid Klekks", price: "118 €", left: 930, top: 100, rot: 7 },
  { src: `${C}/v1774880215/envly/qvmmu072jdgpovvmp5ca.webp`, title: "Bougeoir Churros", price: "59,95 €", left: 840, top: 210, rot: -1, reserved: true },
];

export default async function Image() {
  return renderOg(
    <>
      <div style={{ position: "absolute", left: 64, top: 175, width: 680, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 70, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>Offrez juste.</div>
        <div style={{ fontSize: 70, fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, color: "#8e8e96" }}>Gardez la surprise.</div>
        <div style={{ marginTop: 26, fontSize: 26, fontWeight: 500, color: "#a1a1aa", lineHeight: 1.35, maxWidth: 600 }}>
          Votre liste d’envies, partagée. Vos proches réservent en secret.
        </div>
      </div>
      {CARDS.map((c) => (
        <div
          key={c.title}
          style={{
            position: "absolute",
            left: c.left,
            top: c.top,
            width: 220,
            display: "flex",
            flexDirection: "column",
            borderRadius: 26,
            overflow: "hidden",
            background: "#161618",
            border: "1px solid rgba(255,255,255,0.12)",
            transform: `rotate(${c.rot}deg)`,
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ogImage(c.src, 440, 440)!} width={220} height={220} alt="" style={{ objectFit: "cover" }} />
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 16px" }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{c.title}</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#a1a1aa" }}>{c.price}</span>
          </div>
          {c.reserved && (
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", padding: "6px 12px", borderRadius: 999, background: "rgba(0,0,0,0.8)", color: GOLD, fontSize: 16, fontWeight: 700 }}>
              Réservé
            </div>
          )}
        </div>
      ))}
    </>
  );
}
