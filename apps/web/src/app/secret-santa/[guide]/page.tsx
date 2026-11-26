import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow, FaqList, SantaCta, SeoShell } from "@/components/seo-article";
import { faqLd, GUIDES, guideBySlug } from "@/lib/santa-guides";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ guide: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ guide: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).guide);
  if (!g) return {};
  const url = `/secret-santa/${g.slug}`;
  return {
    title: { absolute: `${g.title} · Envly` },
    description: g.description,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.description, url, type: "article" },
    twitter: { card: "summary_large_image", title: g.title, description: g.description },
  };
}

export default async function GuidePage({ params }: Props) {
  const g = guideBySlug((await params).guide);
  if (!g) notFound();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Secret Santa", item: `${SITE_URL}/secret-santa` },
      { "@type": "ListItem", position: 2, name: g.h1, item: `${SITE_URL}/secret-santa/${g.slug}` },
    ],
  };
  const others = GUIDES.filter((o) => o.slug !== g.slug);

  return (
    <SeoShell jsonLd={[breadcrumb, ...(g.faq.length ? [faqLd(g.faq)] : [])]}>
      <article className="mx-auto max-w-2xl space-y-12">
        <header className="space-y-5">
          <nav aria-label="Fil d'Ariane" className="text-xs text-muted-foreground">
            <Link href="/secret-santa" className="hover:text-foreground">
              Secret Santa
            </Link>{" "}
            / {g.h1}
          </nav>
          <Eyebrow>Guide Secret Santa</Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight">{g.h1}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{g.intro}</p>
        </header>

        {g.sections.map((s) => (
          <section key={s.h2} className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">{s.h2}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground marker:text-[#E8C872]">
                {s.list.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="space-y-5 rounded-3xl border border-[#E8C872]/30 bg-card p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Lancez votre tirage maintenant</h2>
          <p className="text-muted-foreground">Gratuit, sans publicité, avec listes d&apos;envies et exclusions.</p>
          <SantaCta />
        </section>

        {g.faq.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Questions fréquentes</h2>
            <FaqList faq={g.faq} />
          </section>
        )}

        <nav className="space-y-3" aria-label="Autres guides">
          <h2 className="text-lg font-semibold">À lire aussi</h2>
          <ul className="space-y-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/secret-santa/${o.slug}`} className="text-sm underline-offset-4 hover:underline">
                  {o.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/idees-cadeaux/moins-de-20" className="text-sm underline-offset-4 hover:underline">
                Idées cadeaux à moins de 20 €
              </Link>
            </li>
          </ul>
        </nav>
      </article>
    </SeoShell>
  );
}
