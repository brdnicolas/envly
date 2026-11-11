import { prisma } from "@/lib/prisma";
import { GOLD, OG_SIZE, renderOg } from "@/lib/og/render";

export const alt = "Invitation à un Secret Santa sur Envly";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Invite links are the most shared URL: make them feel like an invitation card. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await prisma.secretSanta.findUnique({
    where: { inviteCode: code },
    select: { name: true, budget: true, date: true, organizer: { select: { name: true } }, _count: { select: { members: true } } },
  });
  const meta = [
    s?.budget ? `${s.budget} € max` : null,
    s?.date ? new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : null,
    s ? `${s._count.members} participant${s._count.members > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return renderOg(
    <div style={{ position: "absolute", left: 64, top: 160, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: GOLD }}>SECRET SANTA</div>
      <div style={{ marginTop: 18, fontSize: 84, fontWeight: 800, letterSpacing: -3.5, lineHeight: 1.02, maxWidth: 1060 }}>{s?.name ?? "Secret Santa"}</div>
      <div style={{ marginTop: 22, fontSize: 32, fontWeight: 500, color: "#d4d4d8" }}>
        {s?.organizer.name ?? "Un ami"} vous invite à participer
      </div>
      {meta.length > 0 && (
        <div style={{ marginTop: 34, display: "flex", gap: 14 }}>
          {meta.map((m) => (
            <div key={String(m)} style={{ padding: "12px 22px", borderRadius: 999, border: `2px solid ${GOLD}66`, color: GOLD, fontSize: 24, fontWeight: 700 }}>
              {m}
            </div>
          ))}
        </div>
      )}
    </div>,
    { gold: true }
  );
}
