import { ArrowRight, Gift } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import type { Faq } from "@/lib/santa-guides";

export const GOLD = "#E8C872";

/** Shared shell of the content pages (Secret Santa guides, gift ideas): header, readable column, footer. */
export function SeoShell({ children, jsonLd }: { children: React.ReactNode; jsonLd?: object[] }) {
  return (
    <div className="flex min-h-screen flex-col">
      {jsonLd?.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      ))}
      <Header />
      <main className="flex-1 px-4 py-12 md:py-16">{children}</main>
      <Footer />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: GOLD }}>
      <Gift className="h-3.5 w-3.5" /> {children}
    </p>
  );
}

export function SantaCta({ label = "Créer mon Secret Santa" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="h-12 rounded-xl px-6">
        <Link href="/secret-santa/nouveau">
          {label} <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
        <Link href="/install">Télécharger l&apos;app</Link>
      </Button>
    </div>
  );
}

export function FaqList({ faq }: { faq: Faq[] }) {
  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
      {faq.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
            <span className="flex items-center justify-between gap-4">
              {f.q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
