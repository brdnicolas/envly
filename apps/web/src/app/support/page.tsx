import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Mail, ShieldCheck, Smartphone, Puzzle } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const CONTACT = "contact@envly.fr";

export const metadata: Metadata = {
  title: "Aide et contact",
  description: "Une question sur Envly, l’app ou l’extension ? Les réponses aux questions fréquentes et comment nous contacter.",
  alternates: { canonical: "/support" },
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Mes proches voient-ils qui a réservé un cadeau ?",
    a: "Les autres visiteurs voient qu’un cadeau est déjà pris, pour ne pas l’offrir deux fois. Vous, propriétaire de la liste, ne voyez jamais ce qui est réservé ni par qui : la surprise est préservée.",
  },
  {
    q: "Faut-il un compte pour réserver un cadeau ?",
    a: "Non. Il suffit d’ouvrir le lien de la liste et d’indiquer son prénom. Un compte sert seulement à créer ses propres listes et à suivre ses amis.",
  },
  {
    q: "Comment ajouter un produit depuis une boutique ?",
    a: (
      <>
        Sur iPhone, partagez la page du produit vers Envly depuis Safari ou l’app de la boutique. Sur ordinateur,
        installez{" "}
        <Link href="/extension" className="underline underline-offset-4 hover:text-foreground">
          l’extension Chrome
        </Link>
        . Vous pouvez aussi coller un lien avec le bouton « Ajouter ».
      </>
    ),
  },
  {
    q: "Comment fonctionne le Secret Santa ?",
    a: "Créez l’échange (nom, budget, date), invitez vos amis, puis lancez le tirage. Chacun reçoit une notification et découvre à qui il offre, avec la liste de cette personne. Personne d’autre, pas même l’organisateur, ne connaît le tirage.",
  },
  {
    q: "Je ne reçois pas les notifications",
    a: "Sur iPhone : Réglages → Notifications → Envly, puis activez « Autoriser les notifications ». Vérifiez aussi que vous êtes connecté au même compte que sur le site.",
  },
  {
    q: "Comment supprimer mon compte ?",
    a: "Dans l’app : Compte → Supprimer mon compte. Sur le site : Paramètres → Supprimer mon compte. Vos listes, envies et réservations sont supprimées définitivement.",
  },
];

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pb-12 pt-14 sm:pt-20">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Besoin d’aide ?</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Une question, un bug, une idée ? Écrivez-nous, une vraie personne vous répond, en général sous 48 heures.
          </p>

          <a
            href={`mailto:${CONTACT}?subject=${encodeURIComponent("Support Envly")}`}
            className="group mt-8 flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-6 transition-colors hover:border-foreground/20"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/60">
              <Mail className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted-foreground">Écrivez-nous</span>
              <span className="block truncate text-lg font-medium">{CONTACT}</span>
            </span>
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            Pour un problème dans l’app, indiquez votre modèle d’iPhone et ce que vous faisiez : ça nous aide à corriger vite.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="text-2xl font-semibold tracking-tight">Questions fréquentes</h2>
          <div className="mt-6 divide-y divide-border/60 border-y border-border/60">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-3xl gap-3 px-6 pb-24 sm:grid-cols-3">
          {[
            { href: "/install", icon: Smartphone, label: "Installer l’app" },
            { href: "/extension", icon: Puzzle, label: "Extension Chrome" },
            { href: "/privacy.html", icon: ShieldCheck, label: "Confidentialité" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm transition-colors hover:border-foreground/20"
            >
              <l.icon className="h-4 w-4 text-muted-foreground" /> {l.label}
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
