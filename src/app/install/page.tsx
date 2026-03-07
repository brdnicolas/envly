"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Share, Plus, Download, Smartphone, Monitor, ArrowLeft, Chrome, ExternalLink } from "lucide-react";
import Link from "next/link";

const SHORTCUT_URL = "https://www.icloud.com/shortcuts/5eea1f1410d34d479f6e32fed6cd1483";
const EXTENSION_URL = "https://chromewebstore.google.com/detail/nfchfkcbbiedjgiebgfhlkondnekfdjp";

export default function InstallPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </Link>

        <h1 className="text-2xl font-semibold mb-2">Installer Envly</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Ajoutez des souhaits en un tap depuis n&apos;importe quel site.
        </p>

        {/* CTA: Raccourci iOS (mobile) */}
        <section className="mb-6 lg:hidden">
          <a
            href={SHORTCUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Share className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm mb-0.5">Installer le raccourci iOS</h2>
                <p className="text-xs text-muted-foreground">
                  Partagez n&apos;importe quel site vers Envly depuis Safari.
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </a>
        </section>

        {/* CTA: Extension Chrome (desktop) */}
        <section className="mb-6 hidden lg:block">
          <a
            href={EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Chrome className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm mb-0.5">Extension Chrome</h2>
                <p className="text-xs text-muted-foreground">
                  Ajoutez des souhaits en un clic depuis n&apos;importe quel site.
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </a>
        </section>

        {/* PWA install iOS (mobile) */}
        <section className="mb-6 lg:hidden">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Installer l&apos;app (iPhone / iPad)</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-md bg-foreground/10 flex items-center justify-center text-[11px] font-semibold shrink-0">1</span>
                <span>Ouvrez <strong className="text-foreground">envly.fr</strong> dans Safari</span>
              </li>
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-md bg-foreground/10 flex items-center justify-center text-[11px] font-semibold shrink-0">2</span>
                <span>Appuyez sur <Share className="h-3.5 w-3.5 inline-block mx-0.5 -mt-0.5" /> puis <strong className="text-foreground">Sur l&apos;écran d&apos;accueil</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-md bg-foreground/10 flex items-center justify-center text-[11px] font-semibold shrink-0">3</span>
                <span>Appuyez sur <strong className="text-foreground">Ajouter</strong></span>
              </li>
            </ol>
          </div>
        </section>

        {/* PWA install Android (mobile) */}
        <section className="mb-6 lg:hidden">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Installer l&apos;app (Android)</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-md bg-foreground/10 flex items-center justify-center text-[11px] font-semibold shrink-0">1</span>
                <span>Ouvrez <strong className="text-foreground">envly.fr</strong> dans Chrome</span>
              </li>
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-md bg-foreground/10 flex items-center justify-center text-[11px] font-semibold shrink-0">2</span>
                <span>Menu <strong className="text-foreground">⋮</strong> → <strong className="text-foreground">Installer l&apos;application</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="h-5 w-5 rounded-md bg-foreground/10 flex items-center justify-center text-[11px] font-semibold shrink-0">3</span>
                <span>Partagez n&apos;importe quel site → <strong className="text-foreground">Envly</strong> apparaît directement</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Desktop: lien vers raccourci iOS */}
        <section className="hidden lg:block">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Sur mobile</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Ouvrez cette page sur votre téléphone pour installer l&apos;app et le raccourci de partage.
            </p>
            <a href={SHORTCUT_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="rounded-xl">
                <Download className="h-4 w-4 mr-1.5" />
                Raccourci iOS
              </Button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
