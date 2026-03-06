"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  EyeOff,
  Globe,
  Puzzle,
  Smartphone,
  UserCircle,
  Share2,
  ArrowRight,
  Gift,
  Heart,
  Star,
  Sparkles,
  Check,
} from "lucide-react";

/* ─── animation variants ─── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

/* ─── floating wish card data ─── */

const floatingCards = [
  { title: "AirPods Max", price: "579 €", emoji: "🎧", x: 0, y: 0, rotate: -6, delay: 0 },
  { title: "Atomic Habits", price: "15 €", emoji: "📖", x: 180, y: -30, rotate: 3, delay: 0.1 },
  { title: "Nike Air Max", price: "129 €", emoji: "👟", x: 30, y: 160, rotate: -3, delay: 0.2 },
  { title: "Lego Technic", price: "89 €", emoji: "🧱", x: 210, y: 140, rotate: 5, delay: 0.3 },
  { title: "Dyson V15", price: "699 €", emoji: "✨", x: 90, y: 310, rotate: -2, delay: 0.4 },
];

/* ─── step data ─── */

const steps = [
  {
    number: "01",
    title: "Create",
    description: "Add items by URL or manually. We auto-fill product details like magic.",
    icon: Gift,
  },
  {
    number: "02",
    title: "Share",
    description: "Send your link to anyone. No account needed to view your wishlist.",
    icon: Share2,
  },
  {
    number: "03",
    title: "Receive",
    description: "Gifts get reserved anonymously. The surprise stays intact.",
    icon: Heart,
  },
];

/* ─── features data ─── */

const features = [
  {
    icon: EyeOff,
    title: "Anonymous reservations",
    description: "Surprises stay surprises. You'll never know who reserved what.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: Globe,
    title: "Auto-scraping",
    description: "Paste a URL — we extract title, image and price automatically.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Puzzle,
    title: "Chrome extension",
    description: "One click to add items from any website to your wishlists.",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
  {
    icon: Smartphone,
    title: "Install as app",
    description: "Install on your phone. Share links directly from other apps.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: UserCircle,
    title: "Public profiles",
    description: "Your own page with all public wishlists in one place.",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: Share2,
    title: "Easy sharing",
    description: "Anyone can view and reserve — no sign-up required.",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
];

/* ─── parallax floating card ─── */

function FloatingCard({
  title,
  price,
  emoji,
  x,
  y,
  rotate,
  delay,
  scrollY,
}: (typeof floatingCards)[0] & { scrollY: MotionValue<number> }) {
  const yOffset = useTransform(scrollY, [0, 600], [0, -40 - y * 0.15]);
  const smoothY = useSpring(yOffset, { stiffness: 50, damping: 20 });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-50, 50], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY2 = useSpring(useTransform(mouseX, [-50, 50], [-8, 8]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      className="absolute w-44 select-none"
      style={{ left: x, top: y, y: smoothY }}
      initial={{ opacity: 0, y: 40, rotate: rotate * 2 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 0.8, delay: 0.4 + delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-lg cursor-default"
        style={{ rotateX, rotateY: rotateY2 }}
        whileHover={{
          scale: 1.08,
          boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)",
          transition: { duration: 0.3 },
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          mouseX.set(e.clientX - rect.left - rect.width / 2);
          mouseY.set(e.clientY - rect.top - rect.height / 2);
        }}
        onMouseLeave={() => {
          mouseX.set(0);
          mouseY.set(0);
        }}
      >
        <div className="text-3xl mb-2">{emoji}</div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{price}</p>
      </motion.div>
    </motion.div>
  );
}

/* ─── animated counter ─── */

function AnimatedBadge({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {children}
    </motion.span>
  );
}

/* ─── page ─── */

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.97]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <motion.section
          ref={heroRef}
          className="relative pt-20 sm:pt-28 pb-32 sm:pb-40"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Subtle gradient orbs — full width */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-purple-500/5 blur-3xl"
              animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <AnimatedBadge>
                  <Sparkles className="h-3 w-3" />
                  Free &amp; open — no ads, ever
                </AnimatedBadge>
              </motion.div>

              <motion.h1
                className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                Wishlists, shared.
                <br />
                <motion.span
                  className="text-muted-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Surprises, kept.
                </motion.span>
              </motion.h1>

              <motion.p
                className="mt-5 text-lg text-muted-foreground max-w-md leading-relaxed"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Create beautiful wishlists, share them with anyone. Gifts get
                reserved anonymously &mdash; the surprise stays intact.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-wrap items-center gap-3"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <Button size="lg" className="group" asChild>
                  <Link href="/signup">
                    Get started free
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signin">Sign in</Link>
                </Button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                className="mt-8 flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div className="flex -space-x-2">
                  {["A", "M", "S", "L"].map((l, i) => (
                    <div
                      key={l}
                      className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                      style={{ zIndex: 4 - i }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Loved by hundreds of users
                </p>
              </motion.div>
            </div>

            {/* Right: floating cards */}
            <div className="hidden lg:block relative h-[440px]">
              {floatingCards.map((card) => (
                <FloatingCard
                  key={card.title}
                  {...card}
                  scrollY={scrollY}
                />
              ))}

              {/* Floating decorative elements */}
              <motion.div
                className="absolute top-2 right-8 text-muted-foreground/20"
                animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Star className="h-6 w-6" />
              </motion.div>
              <motion.div
                className="absolute bottom-16 right-2 text-muted-foreground/15"
                animate={{ y: [0, 12, 0], rotate: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Heart className="h-5 w-5" />
              </motion.div>
              <motion.div
                className="absolute top-40 -left-4 text-muted-foreground/15"
                animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                <Gift className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ── How it works ── */}
        <section className="relative border-t border-border">
          <div className="max-w-6xl mx-auto px-4 py-24">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Simple as 1-2-3
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
                How it works
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="relative group"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeScale}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <div className="rounded-2xl border border-border bg-card p-6 h-full transition-all duration-300 group-hover:border-foreground/20 group-hover:shadow-lg">
                    {/* Step number */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-4xl font-bold text-muted-foreground/20 tabular-nums">
                        {step.number}
                      </span>
                      <motion.div
                        className="h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center"
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <step.icon className="h-5 w-5 text-foreground/70" />
                      </motion.div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connector line on desktop */}
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 -right-4 sm:-right-5 w-8 sm:w-10 h-px bg-border" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features showcase ── */}
        <section className="relative border-t border-border bg-muted/20">
          <div className="max-w-6xl mx-auto px-4 py-24">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Features
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
                Everything you need
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Designed to be simple yet powerful. No bloat, just what matters.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-foreground/20 hover:shadow-lg overflow-hidden"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                >
                  {/* Hover gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div className="relative">
                    <motion.div
                      className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-foreground/5 mb-4"
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <feature.icon className="h-5 w-5 text-foreground/70" />
                    </motion.div>
                    <h3 className="font-semibold mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social proof / trust ── */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 py-20">
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              {[
                { value: "100%", label: "Free forever" },
                { value: "0", label: "Ads" },
                { value: "∞", label: "Wishlists" },
                { value: "< 1s", label: "To share" },
              ].map((stat) => (
                <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.5 }}>
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative border-t border-border overflow-hidden">
          {/* Background gradient */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              <motion.h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold"
                variants={fadeUp}
                transition={{ duration: 0.6 }}
              >
                Ready to create
                <br />
                your wishlist?
              </motion.h2>
              <motion.p
                className="mt-4 text-muted-foreground text-lg"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Join now. It takes less than 30 seconds.
              </motion.p>
              <motion.div
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                <Button size="lg" className="group min-w-48" asChild>
                  <Link href="/signup">
                    Create your account
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Free forever
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> No credit card
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> No ads
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
