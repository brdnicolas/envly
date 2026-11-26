import Link from "next/link";
import { Eyebrow, SeoShell } from "@/components/seo-article";
import { WishImage } from "@/components/wish-image";
import { BUDGETS, type BudgetKey, type DiscoverItem } from "@/lib/discover";
import { thumb } from "@/lib/image";

const domain = (url: string | null) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

/** Gift-ideas page body: budget chips + grid of the most wished-for products (links through /api/go). */
export function GiftIdeas({ budget, items, h1, intro }: { budget: BudgetKey | null; items: DiscoverItem[]; h1: string; intro: string }) {
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: it.title,
        ...(it.imageUrl && { image: it.imageUrl }),
        ...(it.price != null && { offers: { "@type": "Offer", price: it.price, priceCurrency: "EUR", ...(it.url && { url: it.url }) } }),
      },
    })),
  };

  return (
    <SeoShell jsonLd={[listLd]}>
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="max-w-2xl space-y-4">
          <Eyebrow>Idées cadeaux</Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight">{h1}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{intro}</p>
          <nav className="flex flex-wrap gap-2 pt-2" aria-label="Budgets">
            <Chip href="/idees-cadeaux" active={!budget} label="Toutes" />
            {Object.entries(BUDGETS).map(([key, b]) => (
              <Chip key={key} href={`/idees-cadeaux/${key}`} active={budget === key} label={b.label} />
            ))}
          </nav>
        </header>

        {items.length === 0 ? (
          <p className="text-muted-foreground">De nouvelles idées arrivent chaque jour, revenez bientôt.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <li key={it.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                <a href={it.url ? `/api/go?url=${encodeURIComponent(it.url)}` : undefined} target="_blank" rel="noopener sponsored" className="block">
                  {it.imageUrl && (
                    <WishImage src={thumb(it.imageUrl, 480)} width={it.imageWidth} height={it.imageHeight} alt={it.title} />
                  )}
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-sm font-medium">{it.title}</p>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{domain(it.url)}</span>
                      {it.price != null && <span className="font-semibold text-foreground tabular-nums">{it.price.toFixed(2)} €</span>}
                    </div>
                    {it.popularity > 1 && <p className="text-[11px] text-muted-foreground">Dans {it.popularity} listes</p>}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        <section className="max-w-2xl space-y-3 rounded-3xl border border-border/60 bg-card p-8">
          <h2 className="text-xl font-semibold">Vous aussi, faites votre liste</h2>
          <p className="text-sm text-muted-foreground">
            Ajoutez des envies depuis n&apos;importe quelle boutique, partagez votre liste : vos proches réservent en secret. Ou
            organisez un <Link href="/secret-santa" className="underline underline-offset-4">Secret Santa</Link> gratuit.
          </p>
          <Link href="/signup" className="inline-block text-sm font-medium underline underline-offset-4">
            Créer ma liste gratuitement →
          </Link>
        </section>
      </div>
    </SeoShell>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${active ? "border-[#E8C872] bg-[#E8C872]/10" : "border-border/60 hover:border-foreground/30"}`}
    >
      {label}
    </Link>
  );
}
