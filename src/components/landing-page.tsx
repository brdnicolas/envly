"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Check,
  Chrome,
  EyeOff,
  Gift,
  Heart,
  Link2,
  Lock,
  Share,
  Smartphone,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;
const GOLD = "#E8C872";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: EASE },
};

const SHOPS = ["Amazon", "Zara", "Fnac", "IKEA", "Sézane", "Apple", "Decathlon", "Etsy", "Sephora", "Cos", "Muji", "Nike", "Darty", "La Redoute"];

/* Product placeholders drawn in CSS: no stock photos, still feels real. */
const WISHES = [
  { title: "Casque sans fil", price: "349 €", hue: "from-zinc-200 to-zinc-400", icon: "🎧", tall: true },
  { title: "Bougeoir vague", price: "42 €", hue: "from-indigo-300 to-blue-500", icon: "🕯️" },
  { title: "Roman graphique", price: "24 €", hue: "from-amber-200 to-orange-400", icon: "📚" },
  { title: "Plaid laine", price: "89 €", hue: "from-rose-200 to-pink-400", icon: "🧶", tall: true, reserved: true },
  { title: "Baskets running", price: "140 €", hue: "from-lime-200 to-emerald-400", icon: "👟" },
  { title: "Carafe en verre", price: "35 €", hue: "from-sky-200 to-cyan-400", icon: "🫗" },
];

/* ─────────────────────────── building blocks ─────────────────────────── */

function Eyebrow({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <p
      className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
      style={gold ? { color: GOLD } : undefined}
    >
      {children}
    </p>
  );
}

function WishTile({ w, small }: { w: (typeof WISHES)[number]; small?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br ${w.hue} ${w.tall ? "aspect-[3/4]" : "aspect-square"}`}
      >
        <span className={small ? "text-2xl" : "text-3xl"}>{w.icon}</span>
        {w.reserved && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[8px] font-medium text-white backdrop-blur">
            <Check className="h-2 w-2" /> Réservé
          </span>
        )}
      </div>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-[10px] font-medium text-white">{w.title}</p>
        <p className="text-[9px] text-white/50">{w.price}</p>
      </div>
    </div>
  );
}

/** iPhone 17 Pro-style frame around a real screenshot of the app. */
function PhoneMockup() {
  const button = "absolute w-[3px] rounded-sm bg-gradient-to-b from-[#6b6b70] via-[#3a3a3e] to-[#55555a]";
  return (
    <div className="relative mx-auto w-[290px] sm:w-[310px]">
      {/* side buttons */}
      <span className={`${button} -left-[2px] top-[118px] h-7`} />
      <span className={`${button} -left-[2px] top-[166px] h-12`} />
      <span className={`${button} -left-[2px] top-[222px] h-12`} />
      <span className={`${button} -right-[2px] top-[190px] h-[72px]`} />
      {/* titanium band */}
      <div className="rounded-[58px] bg-[linear-gradient(145deg,#77777d_0%,#2a2a2e_22%,#1a1a1d_50%,#3a3a3f_78%,#8a8a90_100%)] p-[3px] shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95),0_30px_60px_-30px_rgba(232,200,114,0.18)]">
        {/* black bezel */}
        <div className="rounded-[55px] bg-black p-[11px]">
          <div className="relative overflow-hidden rounded-[45px] bg-[#0b0b0c]">
            <Image
              src="/landing/app-list.webp"
              alt="Une liste d’envies dans l’app Envly"
              width={640}
              height={1391}
              priority
              className="block h-auto w-full"
            />
            {/* Dynamic Island */}
            <span className="absolute left-1/2 top-[11px] h-[27px] w-[88px] -translate-x-1/2 rounded-full bg-black" />
            {/* glass glare */}
            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_28%,transparent_45%)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small floating card next to the phone. */
function FloatCard({ className, delay, children }: { className: string; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      className={`absolute z-10 rounded-2xl border border-white/10 bg-[#141416]/90 p-3 shadow-2xl backdrop-blur-xl ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay, ease: EASE },
        y: { duration: 5, delay: delay + 0.6, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {children}
    </motion.div>
  );
}

function Avatar({ letter, tone }: { letter: string; tone: string }) {
  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#141416] text-[11px] font-semibold text-white ${tone}`}>
      {letter}
    </span>
  );
}

function BentoCard({
  className = "",
  children,
  gold,
}: {
  className?: string;
  children: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <motion.div
      {...reveal}
      className={`group relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-7 transition-colors ${
        gold ? "border-[#E8C872]/25 hover:border-[#E8C872]/45" : "border-border/60 hover:border-foreground/15"
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon: Icon, title, text, gold }: { icon: typeof Gift; title: string; text: string; gold?: boolean }) {
  return (
    <div className="space-y-2">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60"
        style={gold ? { background: "rgba(232,200,114,0.12)", color: GOLD } : undefined}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h3 className="pt-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

/* ─────────────────────────────── page ─────────────────────────────── */

export function LandingPage() {
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 600], [0, 120]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative">
          <motion.div
            aria-hidden
            style={{ y: glowY }}
            className="pointer-events-none absolute left-1/2 top-[-280px] h-[640px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.09),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:pb-32">
            <div>

              <motion.h1
                className="text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
              >
                Offrez juste.
                <br />
                <span className="bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent">
                  Gardez la surprise.
                </span>
              </motion.h1>

              <motion.p
                className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
              >
                Rassemblez vos envies depuis n&apos;importe quel site, partagez vos listes avec vos proches.
                Ils réservent en secret, vous découvrez le jour J.
              </motion.p>

              <motion.div
                className="mt-9 flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.38, ease: EASE }}
              >
                <Button size="lg" className="group h-12 rounded-full px-6 text-[15px]" asChild>
                  <Link href="/signup">
                    Créer ma liste
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="h-12 rounded-full px-5 text-[15px] text-muted-foreground" asChild>
                  <Link href="/install">
                    <Smartphone className="h-4 w-4" /> Installer l&apos;app
                  </Link>
                </Button>
              </motion.div>

              <motion.ul
                className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                {["100 % gratuit", "Sans publicité", "Sans compte pour réserver"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-foreground/70" /> {t}
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* Phone + floating moments */}
            <motion.div
              className="relative mx-auto w-full max-w-[420px] py-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
            >
              <div aria-hidden className="absolute inset-x-10 top-16 bottom-10 rounded-full bg-[radial-gradient(closest-side,rgba(232,200,114,0.16),transparent)] blur-2xl" />
              <PhoneMockup />
              <FloatCard className="-left-2 top-[46%] sm:-left-12" delay={0.9}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Check className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-white">Bouquet de fleurs réservé</p>
                    <p className="text-[10px] text-white/50">par quelqu&apos;un · surprise !</p>
                  </div>
                </div>
              </FloatCard>
              <FloatCard className="-right-2 bottom-28 sm:-right-10" delay={1.15}>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
                  Secret Santa
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Avatar letter="J" tone="bg-gradient-to-br from-pink-400 to-rose-600" />
                  <div>
                    <p className="text-[10px] text-white/50">Vous offrez à</p>
                    <p className="text-[13px] font-semibold text-white">Jules</p>
                  </div>
                </div>
              </FloatCard>
            </motion.div>
          </div>
        </section>

        {/* ── Shops marquee ── */}
        <section className="border-y border-border/60 py-8">
          <p className="mb-5 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
            Ajoutez depuis n&apos;importe quelle boutique
          </p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
            <motion.div
              className="flex w-max gap-12 pr-12"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
            >
              {[...SHOPS, ...SHOPS].map((s, i) => (
                <span key={i} className="text-xl font-semibold tracking-tight text-foreground/25">
                  {s}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Bento ── */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <motion.div {...reveal} className="max-w-2xl">
            <Eyebrow>Tout ce qu&apos;il faut</Eyebrow>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Fini les cadeaux à côté de la plaque.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Une liste qui se remplit toute seule, des proches qui savent quoi offrir, et zéro doublon.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            {/* Paste a link */}
            <BentoCard className="md:col-span-4">
              <CardTitle
                icon={Link2}
                title="Collez un lien, c’est rempli"
                text="Titre, photo et prix sont récupérés automatiquement, sur la plupart des boutiques en ligne."
              />
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-3">
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 font-mono text-[12px] text-muted-foreground">
                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">boutique.fr/produits/bougeoir-vague-bleu</span>
                </div>
                <motion.div
                  className="mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-300 to-blue-500 text-xl">🕯️</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Bougeoir vague, bleu</p>
                    <p className="text-xs text-muted-foreground">42,00 € · boutique.fr</p>
                  </div>
                  <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">Ajouter</span>
                </motion.div>
              </div>
            </BentoCard>

            {/* Anonymous reservations */}
            <BentoCard className="md:col-span-2">
              <CardTitle
                icon={EyeOff}
                title="Réservations secrètes"
                text="Vos proches réservent, vous ne voyez jamais qui. Et personne n’offre deux fois la même chose."
              />
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-200 to-pink-400 text-lg">🧶</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Plaid laine</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" /> Réservé par ●●●●●
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* Secret Santa */}
            <BentoCard gold className="md:col-span-3">
              <CardTitle
                gold
                icon={Gift}
                title="Secret Santa intégré"
                text="Invitez vos amis, fixez un budget, Envly tire au sort. Chacun découvre à qui il offre, et voit sa liste."
              />
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#E8C872]/20 bg-[#E8C872]/[0.04] p-4">
                <div className="flex -space-x-2">
                  <Avatar letter="N" tone="bg-gradient-to-br from-zinc-500 to-zinc-700" />
                  <Avatar letter="J" tone="bg-gradient-to-br from-pink-400 to-rose-600" />
                  <Avatar letter="T" tone="bg-gradient-to-br from-cyan-400 to-blue-600" />
                  <Avatar letter="C" tone="bg-gradient-to-br from-violet-400 to-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">30 € max · J-12</p>
                  <p className="text-sm font-medium" style={{ color: GOLD }}>
                    Tirage effectué ✨
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* Friends */}
            <BentoCard className="md:col-span-3">
              <CardTitle
                icon={Users}
                title="Les envies de vos proches"
                text="Suivez vos amis et retrouvez toutes leurs listes au même endroit. Plus jamais « je ne savais pas quoi t’offrir »."
              />
              <div className="mt-6 grid grid-cols-3 gap-2">
                {WISHES.slice(1, 4).map((w) => (
                  <WishTile key={w.title} w={{ ...w, tall: false, reserved: false }} />
                ))}
              </div>
            </BentoCard>

            {/* Everywhere */}
            <BentoCard className="md:col-span-2">
              <CardTitle
                icon={Share}
                title="Depuis le bouton Partager"
                text="Sur iPhone, partagez une page Safari ou Amazon vers Envly : le produit est ajouté en un geste."
              />
            </BentoCard>
            <BentoCard className="md:col-span-2">
              <CardTitle
                icon={Chrome}
                title="Extension Chrome"
                text="Un clic sur n’importe quelle fiche produit pour l’ajouter à votre liste, sans quitter le site."
              />
            </BentoCard>
            <BentoCard className="md:col-span-2">
              <CardTitle
                icon={Heart}
                title="Listes à plusieurs"
                text="Une liste de naissance, un mariage, un anniversaire commun : invitez des co-auteurs."
              />
            </BentoCard>
          </div>
        </section>

        {/* ── Secret Santa ── */}
        <section id="secret-santa" className="relative scroll-mt-20 overflow-hidden border-y border-[#E8C872]/15">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(232,200,114,0.10),transparent)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 py-24 sm:py-32 lg:grid-cols-2">
            <motion.div {...reveal}>
              <Eyebrow gold>
                <Gift className="h-3.5 w-3.5" /> Secret Santa
              </Eyebrow>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Le tirage au sort,
                <br />
                <span style={{ color: GOLD }}>sans les papiers dans un bonnet.</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Créez l’échange en quatre questions, invitez vos amis, lancez le tirage. Chacun reçoit une
                notification et découvre à qui il offre, avec sa liste sous les yeux.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Sparkles, t: "Un tirage en boucle", d: "Personne ne se tire lui-même, et pas d’échange à deux." },
                  { icon: Lock, t: "Secret absolu", d: "Même l’organisateur ne voit pas les autres paires." },
                  { icon: Star, t: "Une liste dédiée", d: "Importez vos idées dans le budget, en quelques touches." },
                  { icon: Bell, t: "Tout le monde prévenu", d: "Invitations et résultat du tirage en notification." },
                ].map(({ icon: Icon, t, d }) => (
                  <li key={t} className="flex gap-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(232,200,114,0.12)", color: GOLD }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="text-sm text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Reveal card */}
            <motion.div
              className="relative mx-auto w-full max-w-sm"
              initial={{ opacity: 0, rotate: -2, y: 30 }}
              whileInView={{ opacity: 1, rotate: 0, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <div className="rounded-[28px] border border-[#E8C872]/30 bg-card p-8 text-center shadow-[0_30px_100px_-30px_rgba(232,200,114,0.35)]">
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  🎄 Noël en famille
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  {["30 € max", "24 décembre", "J-12"].map((c) => (
                    <span key={c} className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-8 text-sm text-muted-foreground">Vous offrez à</p>
                <motion.div
                  className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-600 text-3xl font-semibold text-white ring-4 ring-[#E8C872]/30"
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", damping: 12, delay: 0.5 }}
                >
                  J
                </motion.div>
                <p className="mt-4 text-2xl font-semibold">Jules</p>
                <div className="mt-6 rounded-full bg-foreground py-3 text-sm font-medium text-background">Voir sa liste</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <motion.div {...reveal} className="text-center">
            <Eyebrow>Comment ça marche</Eyebrow>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Trois gestes, zéro prise de tête.</h2>
          </motion.div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Ajoutez vos envies", d: "Un lien, le bouton Partager ou l’extension : tout atterrit dans vos listes." },
              { n: "02", t: "Partagez le lien", d: "Vos proches consultent et réservent, même sans compte." },
              { n: "03", t: "Laissez-vous surprendre", d: "Vous ne voyez jamais ce qui est réservé. Le jour J, c’est la surprise." },
            ].map((s, i) => (
              <motion.div key={s.n} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
                <p className="font-mono text-sm text-muted-foreground/60">{s.n}</p>
                <div className="mt-4 h-px bg-gradient-to-r from-foreground/30 to-transparent" />
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden border-t border-border/60">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.08),transparent)]" />
          <motion.div {...reveal} className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:py-36">
            <motion.img
              src="/logo.svg"
              alt=""
              className="mx-auto h-20 w-auto drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <h2 className="mt-10 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
              Faites un vœu.
              <br />
              <span className="text-muted-foreground">On s’occupe du reste.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="group h-12 rounded-full px-7 text-[15px]" asChild>
                <Link href="/signup">
                  Créer ma première liste
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-6 text-[15px]" asChild>
                <Link href="/signin">J’ai déjà un compte</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Gratuit, sans publicité, pour toujours.</p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
