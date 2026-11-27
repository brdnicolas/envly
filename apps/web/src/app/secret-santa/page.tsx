import { Bell, EyeOff, ListChecks, MessageCircleQuestion, Shuffle, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, FaqList, GOLD, SantaCta, SeoShell } from "@/components/seo-article";
import { BUDGETS } from "@/lib/discover";
import { faqLd, GUIDES, MAIN_FAQ } from "@/lib/santa-guides";
import { SITE_URL } from "@/lib/site";

const TITLE = "Secret Santa en ligne gratuit : tirage au sort de Noël";
const DESCRIPTION =
  "Organisez votre Secret Santa en ligne gratuitement : invitation par lien, tirage au sort secret, exclusions, budget et listes d'envies. Sans publicité.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} · Envly` },
  description: DESCRIPTION,
  alternates: { canonical: "/secret-santa" },
  keywords: ["secret santa", "secret santa en ligne", "tirage au sort noël", "père noël secret", "tirage au sort cadeaux", "secret santa gratuit"],
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/secret-santa" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const STEPS = [
  { title: "Créez votre Secret Santa", text: "Un nom, un budget, une date. C'est tout." },
  { title: "Invitez avec un lien", text: "WhatsApp, SMS, Slack… chacun rejoint en un clic et ajoute ses envies." },
  { title: "Lancez le tirage", text: "Chacun découvre à qui il offre. Personne d'autre ne voit les paires." },
];

const FEATURES = [
  { icon: Shuffle, title: "Tirage vraiment secret", text: "Même l'organisateur ne voit pas qui offre à qui." },
  { icon: Users, title: "Exclusions", text: "Les couples ou les frères et sœurs ne se tirent pas entre eux." },
  { icon: ListChecks, title: "Listes d'envies", text: "Vous voyez la liste de votre personne : fini les cadeaux ratés." },
  { icon: MessageCircleQuestion, title: "Questions anonymes", text: "« Tu fais quelle taille ? » sans dévoiler qui demande." },
  { icon: Bell, title: "Notifications", text: "Invitation, tirage, réponses : tout le monde est prévenu." },
  { icon: EyeOff, title: "Gratuit, sans pub", text: "Pas de publicité, pas de revente de données." },
];

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Organiser un Secret Santa en ligne",
  description: DESCRIPTION,
  totalTime: "PT5M",
  step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text, url: `${SITE_URL}/secret-santa#etapes` })),
};

export default function SecretSantaPage() {
  return (
    <SeoShell jsonLd={[howToLd, faqLd(MAIN_FAQ)]}>
      <div className="mx-auto max-w-3xl space-y-16">
        <header className="space-y-6">
          <Eyebrow>Secret Santa</Eyebrow>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Le Secret Santa en ligne, gratuit et vraiment secret</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Invitez votre famille, vos amis ou vos collègues avec un simple lien, tirez au sort en un clic et découvrez la liste
            d&apos;envies de la personne à qui vous offrez. Fini les papiers dans un bonnet.
          </p>
          <SantaCta />
        </header>

        <section id="etapes" className="scroll-mt-20 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Comment organiser un Secret Santa en 3 étapes</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-border/60 bg-card p-5">
                <span className="text-sm font-semibold" style={{ color: GOLD }}>
                  {i + 1}
                </span>
                <h3 className="mt-2 font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Tout ce qu&apos;il faut pour un tirage réussi</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} />
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Nos guides</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link href={`/secret-santa/${g.slug}`} className="block rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-foreground/20">
                  <span className="font-medium">{g.h1}</span>
                  <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">{g.intro}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Idées cadeaux pour Secret Santa</h2>
          <p className="text-muted-foreground">Les produits les plus ajoutés aux listes Envly, triés par budget.</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BUDGETS).map(([key, b]) => (
              <Link key={key} href={`/idees-cadeaux/${key}`} className="rounded-full border border-border/60 px-4 py-2 text-sm transition-colors hover:border-foreground/30">
                {b.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Questions fréquentes</h2>
          <FaqList faq={MAIN_FAQ} />
        </section>

        <section className="space-y-5 rounded-3xl border border-[#E8C872]/30 bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Prêt pour le tirage ?</h2>
          <p className="text-muted-foreground">Créez votre Secret Santa maintenant, il ne faut que quelques minutes.</p>
          <div className="flex justify-center">
            <SantaCta />
          </div>
        </section>
      </div>
    </SeoShell>
  );
}
