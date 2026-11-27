"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WishImage } from "@/components/wish-image";
import { thumb } from "@/lib/image";

type Person = { id: string; name: string | null; image: string | null; slug?: string | null };
type Feed = {
  upcoming?: { kind: "birthday" | "event"; date: string; days: number; user: Person; collection: { id: string; name: string; slug: string } | null }[];
  newLists?: { id: string; name: string; slug: string; _count: { wishes: number }; wishes: { imageUrl: string | null }[]; owner: Person }[];
  feed: {
    id: string;
    title: string;
    url: string | null;
    imageUrl: string | null;
    imageWidth: number | null;
    imageHeight: number | null;
    price: number | null;
    collection: { id: string; name: string; slug: string };
    owner: Person;
  }[];
};

const first = (n: string | null) => n?.trim().split(/\s+/)[0] || "Un ami";

function PersonAvatar({ p, className = "h-8 w-8" }: { p: Person; className?: string }) {
  return (
    <Avatar className={className}>
      {p.image ? <AvatarImage src={p.image} alt="" /> : null}
      <AvatarFallback>{(p.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

/** "Amis" tab, top part: gift ideas entry, upcoming birthdays/events, latest wishes and new lists of people I follow. */
export function FriendsFeed() {
  const { data } = useSWR<Feed>("/api/friends");
  const upcoming = data?.upcoming ?? [];
  const newLists = data?.newLists ?? [];
  const feed = data?.feed ?? [];

  return (
    <div className="space-y-10">
      <Link
        href="/idees-cadeaux"
        className="flex items-center gap-3 rounded-2xl border border-[#E8C872]/25 bg-[#E8C872]/5 p-4 transition-colors hover:border-[#E8C872]/45"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8C872]/10 text-[#E8C872]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Découvrir des idées cadeaux</span>
          <span className="block text-xs text-muted-foreground">Les produits les plus ajoutés aux listes, par budget.</span>
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">À venir</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((e) => {
              const href = e.collection ? `/w/${e.collection.slug}` : e.user.slug ? `/u/${e.user.slug}` : null;
              const when = e.days === 0 ? "Aujourd'hui" : e.days === 1 ? "Demain" : `Dans ${e.days} jours`;
              const body = (
                <>
                  <PersonAvatar p={e.user} className="h-10 w-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {e.kind === "birthday" ? `🎂 Anniversaire de ${first(e.user.name)}` : `🎁 ${e.collection?.name}`}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {e.kind === "event" ? `${first(e.user.name)} · ` : ""}
                      {new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" })}
                    </span>
                  </span>
                  <span className={`text-xs font-medium ${e.days <= 14 ? "text-[#E8C872]" : "text-muted-foreground"}`}>{when}</span>
                </>
              );
              const cls = "flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3";
              return href ? (
                <Link key={`${e.kind}-${e.collection?.id ?? e.user.id}`} href={href} className={`${cls} transition-colors hover:border-foreground/20`}>
                  {body}
                </Link>
              ) : (
                <div key={`${e.kind}-${e.user.id}`} className={cls}>
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {newLists.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Nouvelles listes</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {newLists.map((l) => (
              <Link key={l.id} href={`/w/${l.slug}`} className="w-36 shrink-0 space-y-1.5">
                <div className="grid h-36 w-36 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-muted">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="relative bg-muted">
                      {l.wishes[i]?.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb(l.wishes[i].imageUrl!, 200)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="truncate text-sm font-medium">{l.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {first(l.owner.name)} · {l._count.wishes} envie{l._count.wishes > 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {feed.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Nouveautés</h2>
            <p className="text-sm text-muted-foreground">Les dernières envies de vos amis</p>
          </div>
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
            {feed.map((w) => (
              <Link
                key={w.id}
                href={`/w/${w.collection.slug}`}
                className="mb-4 block break-inside-avoid overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors hover:border-foreground/20"
              >
                {w.imageUrl && <WishImage src={thumb(w.imageUrl, 480)} width={w.imageWidth} height={w.imageHeight} alt={w.title} />}
                <div className="space-y-1.5 p-3">
                  <p className="line-clamp-2 text-xs font-medium">{w.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                      <PersonAvatar p={w.owner} className="h-5 w-5" />
                      <span className="truncate">{first(w.owner.name)}</span>
                    </span>
                    {w.price != null && <span className="text-xs font-semibold tabular-nums">{w.price.toFixed(2)} €</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
