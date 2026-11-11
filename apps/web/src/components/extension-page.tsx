"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Lock, MousePointerClick, Puzzle, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ExtensionCta } from "@/components/extension-cta";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: EASE },
};

const SLIDES = [
  { src: "/extension/step-1.webp", label: "Repérez", alt: "Le bouton « Ajouter à Envly » apparaît sur une fiche produit" },
  { src: "/extension/step-2.webp", label: "Ajoutez", alt: "Le panneau Envly pré-rempli avec la photo, le titre et le prix" },
  { src: "/extension/step-3.webp", label: "C’est rangé", alt: "Confirmation : le produit est dans la liste Maison" },
  { src: "/extension/step-4.webp", label: "Partagez", alt: "Vos proches voient votre liste et savent quoi offrir" },
  { src: "/extension/step-5.webp", label: "Surprise", alt: "Un proche réserve le cadeau en secret" },
];

const SHOPS = ["Amazon", "Zara", "Fnac", "IKEA", "Sézane", "Etsy", "Decathlon", "Sephora", "Darty", "Nike", "Cos", "La Redoute", "Apple", "Muji"];

const BROWSERS = ["Chrome", "Edge", "Brave", "Arc", "Opera", "Dia"];

const FAQ = [
  {
    q: "Est-ce que c’est gratuit ?",
    a: "Oui, entièrement. L’extension comme Envly sont gratuits et sans publicité.",
  },
  {
    q: "Sur quels navigateurs ça marche ?",
    a: "Tous les navigateurs basés sur Chromium, sur ordinateur : Chrome, Edge, Brave, Arc, Opera, Dia… Safari et Firefox ne sont pas encore pris en charge. Sur iPhone, utilisez l’app Envly et le bouton Partager.",
  },
  {
    q: "Sur quels sites puis-je ajouter un produit ?",
    a: "Presque toutes les boutiques en ligne : Amazon, Zara, Fnac, IKEA, Etsy… Dès qu’une page vend quelque chose, le bouton Envly apparaît. Ailleurs, l’extension reste invisible.",
  },
  {
    q: "Qu’est-ce que l’extension voit de ma navigation ?",
    a: "Rien qui quitte votre navigateur. Elle lit uniquement la page produit sur laquelle vous cliquez, au moment où vous l’ajoutez. Aucun historique n’est collecté ni revendu.",
  },
  {
    q: "Je dois créer un compte ?",
    a: "Oui, pour ranger vos envies dans vos listes. C’est gratuit et ça prend dix secondes avec Google. Connectez-vous une fois sur envly.fr, l’extension s’en souvient.",
  },
  {
    q: "Le produit est mal reconnu, je fais comment ?",
    a: "Tout est modifiable avant d’ajouter : titre, prix, et la photo (plusieurs sont proposées quand la boutique en a).",
  },
];

/* ─────────────────────────── story carousel ─────────────────────────── */

function StoryCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), 3800);
    return () => clearTimeout(t);
  }, [i, paused]);

  return (
    <div className="w-full" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Image src={SLIDES[i].src} alt={SLIDES[i].alt} fill priority={i === 0} sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2" role="tablist" aria-label="Étapes">
        {SLIDES.map((s, n) => (
          <button
            key={s.src}
            role="tab"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className="group text-left"
          >
            <span className="relative block h-[3px] overflow-hidden rounded-full bg-foreground/10">
              {n === i && (
                <motion.span
                  key={`${i}-${paused}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                  initial={{ width: paused ? "100%" : "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: paused ? 0 : 3.8, ease: "linear" }}
                />
              )}
              {n < i && <span className="absolute inset-0 rounded-full bg-foreground/40" />}
            </span>
            <span
              className={cn(
                "mt-2 block truncate text-xs transition-colors",
                n === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/80"
              )}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────── page ─────────────────────────────── */

export function ExtensionPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(50%_60%_at_70%_0%,rgba(255,255,255,0.07),transparent)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <motion.p
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <Puzzle className="h-3.5 w-3.5" /> Extension pour navigateur
              </motion.p>
              <motion.h1
                className="mt-6 text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-6xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
              >
                Une envie ?
                <br />
                <span className="bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent">
                  Un clic, c’est noté.
                </span>
              </motion.h1>
              <motion.p
                className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
              >
                Sur n’importe quelle boutique, le bouton Envly ajoute le produit à votre liste, avec sa photo, son
                titre et son prix. Sans changer d’onglet.
              </motion.p>
              <motion.div
                className="mt-9"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32, ease: EASE }}
              >
                <ExtensionCta />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
            >
              <StoryCarousel />
            </motion.div>
          </div>
        </section>

        {/* ── Shops ── */}
        <section className="border-y border-border/60 py-8">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground/60">
            Fonctionne sur vos boutiques préférées
          </p>
          <ul className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-3 px-6 text-base font-medium text-foreground/50">
            {SHOPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        {/* ── How ── */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <motion.h2 {...reveal} className="text-center text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Prête en 30 secondes.
          </motion.h2>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              { icon: Puzzle, t: "Installez l’extension", d: "Depuis le Chrome Web Store, en un clic. Épinglez-la si vous voulez la garder sous la main." },
              { icon: UserRound, t: "Connectez-vous à Envly", d: "Une seule fois, sur envly.fr. L’extension utilise votre session, pas besoin de mot de passe en plus." },
              { icon: MousePointerClick, t: "Cliquez sur « Ajouter »", d: "Sur une fiche produit, le bouton Envly apparaît. Vérifiez, choisissez la liste, c’est rangé." },
            ].map((s, i) => (
              <motion.div key={s.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Amazon + privacy ── */}
        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-2">
          <motion.div {...reveal} className="rounded-3xl border border-border/60 bg-card p-7 sm:p-8">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9900]/10 text-[#FF9900]">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight">Partout où vous faites vos achats</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Zara, Fnac, IKEA, Etsy ou la petite boutique du coin : dès qu’une page vend quelque chose, le bouton
              Envly apparaît. Sur Amazon, il se glisse même juste sous « Acheter cet article ».
            </p>
            <div className="mt-6 space-y-2 rounded-2xl bg-white p-4 text-[13px] font-medium text-zinc-900">
              <div className="rounded-full bg-[#FFD814] py-2 text-center">Ajouter au panier</div>
              <div className="rounded-full bg-[#FFA41C] py-2 text-center">Acheter cet article</div>
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-zinc-900 py-2 text-white">
                <Sparkles className="h-3.5 w-3.5" /> Ajouter à Envly
              </div>
            </div>
          </motion.div>

          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.08 }}
            className="rounded-3xl border border-border/60 bg-card p-7 sm:p-8"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="h-5 w-5" />
            </span>
            <h3 className="mt-6 text-2xl font-semibold tracking-tight">Discrète, et respectueuse</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Rien ne s’affiche sur les pages qui ne vendent rien. L’extension ne lit que le produit que vous ajoutez.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Aucun historique de navigation collecté", "Aucune publicité, aucune revente de données", "Code léger : moins de 30 Ko"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* ── FAQ ── */}
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <motion.h2 {...reveal} className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Questions fréquentes
          </motion.h2>
          <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
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
          <p className="mt-6 text-sm text-muted-foreground">
            Compatible : {BROWSERS.join(", ")}. Sur iPhone ?{" "}
            <Link href="/install" className="underline underline-offset-4 hover:text-foreground">
              Installez l’app
            </Link>
            .
          </p>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden border-t border-border/60">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.08),transparent)]" />
          <motion.div {...reveal} className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center sm:py-32">
            <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Votre prochaine envie
              <br />
              <span className="text-muted-foreground">est à un clic.</span>
            </h2>
            <ExtensionCta className="mt-10 items-center" />
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
