import Link from "next/link";
import { Logo } from "@/components/logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Produit",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Installer l'app", href: "/install" },
      { label: "Amis", href: "/friends" },
    ],
  },
  {
    title: "Compte",
    links: [
      { label: "Connexion", href: "/signin" },
      { label: "Inscription", href: "/signup" },
      { label: "Paramètres", href: "/settings" },
    ],
  },
  {
    title: "Légal",
    links: [{ label: "Confidentialité", href: "/privacy.html" }],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/60">
      {/* hairline glow on the top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent"
      />

      <div className="mx-auto max-w-6xl px-6 pt-14 pb-10 md:pt-16 md:pb-12">
        <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Logo className="h-7 w-auto" />
              <span className="text-lg font-semibold tracking-tight">
                Envly
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Wishlists partagées, surprises préservées. Vos proches savent quoi
              offrir — vous ne saurez jamais qui l&apos;a réservé.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title} className="space-y-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 md:mt-16 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Envly. Tous droits réservés.</p>
          <p className="tracking-wide">Conçu avec soin en France</p>
        </div>
      </div>
    </footer>
  );
}
