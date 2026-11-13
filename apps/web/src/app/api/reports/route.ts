import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { sendMail, TEAM_EMAIL } from "@/lib/email";

const REASONS: Record<string, string> = {
  inappropriate: "Contenu inapproprié",
  spam: "Spam ou arnaque",
  harassment: "Harcèlement",
  impersonation: "Usurpation d'identité",
  other: "Autre",
};

/**
 * Report a user (optionally one of their lists). Stored, then emailed to the team so it can act
 * within 24 h (App Store guideline 1.2). Recipient: TEAM_EMAIL (see lib/email.ts).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user?.id;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { userId, collectionId, reason } = body as { userId?: unknown; collectionId?: unknown; reason?: unknown };
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 1000) || null : null;
  if (typeof userId !== "string" || !userId || userId === me || typeof reason !== "string" || !(reason in REASONS)) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const [reported, collection] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, slug: true } }),
    typeof collectionId === "string"
      ? prisma.collection.findFirst({ where: { id: collectionId, userId }, select: { id: true, name: true, slug: true } })
      : null,
  ]);
  if (!reported) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = await prisma.report.create({
    data: { reporterId: me, reportedUserId: userId, collectionId: collection?.id ?? null, reason, details },
  });

  const reporter = `${session.user?.name ?? "?"} (${session.user?.email ?? me})`;
  after(async () => {
    try {
      await sendMail({
        to: TEAM_EMAIL,
        subject: `🚩 Signalement : ${REASONS[reason]} — ${reported.name ?? reported.id}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px">
            <h2>Nouveau signalement</h2>
            <p><b>Motif :</b> ${REASONS[reason]}</p>
            ${details ? `<p><b>Détails :</b> ${escapeHtml(details)}</p>` : ""}
            <p><b>Utilisateur signalé :</b> ${escapeHtml(reported.name ?? "")} · ${escapeHtml(reported.email ?? "")} · id ${reported.id}
              ${reported.slug ? ` · <a href="${SITE_URL}/u/${reported.slug}">profil</a>` : ""}</p>
            ${collection ? `<p><b>Liste :</b> <a href="${SITE_URL}/w/${collection.slug}">${escapeHtml(collection.name)}</a></p>` : ""}
            <p><b>Signalé par :</b> ${escapeHtml(reporter)}</p>
            <p style="color:#666">Report ${report.id}. À traiter sous 24 h (suppression du contenu ou du compte).</p>
          </div>`,
      });
    } catch (e) {
      console.error("[reports] email failed", report.id, e);
    }
  });

  return NextResponse.json({ reported: true });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
