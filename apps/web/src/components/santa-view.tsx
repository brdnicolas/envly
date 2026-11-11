"use client";

import { Check, Copy, Gift, Loader2, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { serializeSanta } from "@/lib/secret-santa";

type Santa = ReturnType<typeof serializeSanta>;
type Person = { id: string; name: string | null; image: string | null };

const GOLD = "text-[#E8C872]";

function PersonAvatar({ p, className = "h-9 w-9" }: { p: Person; className?: string }) {
  return (
    <Avatar className={className}>
      {p.image ? <AvatarImage src={p.image} alt="" /> : null}
      <AvatarFallback>{(p.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function meta(s: Pick<Santa, "budget" | "date">) {
  return [
    s.budget ? `${s.budget} € max` : null,
    s.date ? new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function SantaView({
  code,
  initial,
  collections,
  userId,
}: {
  code: string;
  initial: Santa;
  collections: { id: string; name: string }[];
  userId: string;
}) {
  const [santa, setSanta] = useState(initial);
  const [collectionId, setCollectionId] = useState(initial.me?.collection?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const joined = santa.members.filter((m) => m.status === "JOINED");
  const isMember = santa.me?.status === "JOINED";
  const isOpen = santa.status === "OPEN";

  async function call(url: string, method: string, body?: unknown, done?: string) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      if (data?.id) setSanta(data);
      if (done) toast.success(done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  const join = () => call(`/api/santas/join/${code}`, "POST", { collectionId: collectionId || null }, "Vous participez 🎁");
  const setList = (id: string) => {
    setCollectionId(id);
    if (isMember) void call(`/api/santas/${santa.id}/me`, "PATCH", { collectionId: id || null }, "Liste mise à jour");
  };
  const draw = () => {
    if (!confirm(`Lancer le tirage pour ${joined.length} participants ? C'est définitif.`)) return;
    void call(`/api/santas/${santa.id}/draw`, "POST", undefined, "Tirage effectué 🎁");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié");
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <div className="space-y-2">
        <p className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${GOLD}`}>
          <Gift className="h-3.5 w-3.5" /> Secret Santa
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{santa.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[`Organisé par ${santa.isOrganizer ? "vous" : (santa.organizer.name ?? "un ami")}`, meta(santa)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* Who I give to */}
      {santa.status === "DRAWN" && santa.assignment && (
        <section className="rounded-3xl border border-[#E8C872]/30 bg-card p-8 text-center space-y-5">
          <p className="text-sm text-muted-foreground">Vous offrez à</p>
          {revealed ? (
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
              <PersonAvatar p={santa.assignment.user} className="h-20 w-20" />
              <p className="text-2xl font-semibold">{santa.assignment.user.name ?? "Quelqu'un"}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mx-auto flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E8C872]/45 py-8 transition-colors hover:bg-muted/30"
            >
              <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-[#E8C872]/10 text-3xl ${GOLD}`}>?</span>
              <span className="text-sm text-muted-foreground">Cliquer pour révéler</span>
            </button>
          )}
          {santa.assignment.collection?.slug ? (
            <Button asChild className="rounded-xl">
              <Link href={`/w/${santa.assignment.collection.slug}`}>Voir sa liste</Link>
            </Button>
          ) : santa.assignment.collection ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" /> Sa liste est privée : ouvrez-la dans l&apos;app Envly.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Pas encore de liste partagée.</p>
          )}
        </section>
      )}

      {/* List I share */}
      {(isOpen || isMember) && (
        <section className="space-y-2">
          <label htmlFor="santa-list" className="text-sm font-medium">
            La liste que verra votre Secret Santa
          </label>
          <select
            id="santa-list"
            value={collectionId}
            onChange={(e) => setList(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">— Choisir une liste —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Elle reste visible par cette seule personne, même si elle est privée.</p>
        </section>
      )}

      {!isMember && isOpen && (
        <Button onClick={join} disabled={busy} className="h-11 w-full rounded-xl">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Participer"}
        </Button>
      )}
      {!isMember && !isOpen && (
        <p className="text-sm text-muted-foreground">Le tirage a déjà eu lieu, il n&apos;est plus possible de rejoindre.</p>
      )}

      {/* Participants */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          {joined.length} participant{joined.length > 1 ? "s" : ""}
        </h2>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {santa.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <PersonAvatar p={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.id === userId ? "Vous" : (m.name ?? "Invité")}
                  {m.id === santa.organizer.id && <span className="text-muted-foreground"> · organisateur</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.status === "INVITED" ? "Invitation envoyée" : m.hasList ? "Liste partagée" : "Pas encore de liste"}
                </p>
              </div>
              {m.status === "JOINED" && m.hasList && <Check className="h-4 w-4 text-muted-foreground" />}
              {santa.isOrganizer && isOpen && m.id !== userId && (
                <button
                  type="button"
                  aria-label={`Retirer ${m.name ?? ""}`}
                  onClick={() => call(`/api/santas/${santa.id}/members/${m.id}`, "DELETE")}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Organizer */}
      {santa.isOrganizer && isOpen && (
        <section className="space-y-3">
          <Button variant="outline" onClick={copyLink} className="h-11 w-full rounded-xl">
            <Copy className="h-4 w-4" /> Copier le lien d&apos;invitation
          </Button>
          <Button onClick={draw} disabled={busy || joined.length < 3} className="h-11 w-full rounded-xl">
            Lancer le tirage
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {joined.length < 3
              ? `Encore ${3 - joined.length} participant${3 - joined.length > 1 ? "s" : ""} minimum avant le tirage.`
              : "Chacun découvrira à qui il offre. Même vous ne verrez pas les autres paires."}
          </p>
        </section>
      )}
      {!santa.isOrganizer && isOpen && isMember && (
        <p className="text-center text-sm text-muted-foreground">
          En attente du tirage par {santa.organizer.name ?? "l'organisateur"}.
        </p>
      )}
    </div>
  );
}
