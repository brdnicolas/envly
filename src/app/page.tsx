"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Gift, EyeOff, Share2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-24 sm:py-32 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Wishlists, shared.
            <br />
            <span className="text-muted-foreground">Surprises, kept.</span>
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-md mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Create wishlists, share them with friends and family. They can
            reserve gifts anonymously &mdash; you&apos;ll never know who got what.
          </motion.p>
          <motion.div
            className="mt-8 flex items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button size="lg" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
          </motion.div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 py-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  icon: Gift,
                  title: "Create wishlists",
                  description:
                    "Add items manually or paste a URL to auto-fill product details.",
                },
                {
                  icon: Share2,
                  title: "Share with anyone",
                  description:
                    "Generate a public link. No account needed to view or reserve.",
                },
                {
                  icon: EyeOff,
                  title: "Anonymous reservations",
                  description:
                    "Guests reserve gifts, but the owner never sees who reserved what.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-3">Ready to create your wishlist?</h2>
          <p className="text-muted-foreground mb-6">Free, simple, no ads.</p>
          <Button size="lg" asChild>
            <Link href="/signup">Create your account</Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
