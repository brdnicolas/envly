"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Share, Download, ArrowLeft, ExternalLink, Chrome } from "lucide-react";
import Link from "next/link";

const SHORTCUT_URL = "https://www.icloud.com/shortcuts/5eea1f1410d34d479f6e32fed6cd1483";

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

        <h1 className="text-2xl font-semibold mb-2">Ajouter des envies rapidement</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Enregistrez des articles depuis n&apos;importe quel site en un clic.
        </p>

        {/* Extension Chrome */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Extension Chrome</h2>

          <a
            href="https://chromewebstore.google.com/detail/envly-%E2%80%94-ajouter-%C3%A0-ma-wish/nfchfkcbbiedjgiebgfhlkondnekfdjp?hl=fr"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-4 transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Chrome className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-0.5">Installer l&apos;extension Chrome</h3>
                <p className="text-xs text-muted-foreground">
                  Ajoutez des envies en un clic depuis n&apos;importe quel site.
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </a>
        </section>

        {/* Séparateur */}
        <div className="border-t border-border/60 my-10" />

        {/* Raccourci iOS */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Raccourci iOS</h2>

          <a
            href={SHORTCUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-4 transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-0.5">Télécharger le raccourci</h3>
                <p className="text-xs text-muted-foreground">
                  S&apos;installe en un tap via l&apos;app Raccourcis.
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </a>

          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h3 className="font-medium text-sm mb-4">Comment l&apos;utiliser</h3>
            <ol className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">1</span>
                <span>Ouvrez le site d&apos;un article qui vous plaît</span>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">2</span>
                <span>Appuyez sur le bouton <Share className="h-3.5 w-3.5 inline-block mx-0.5 -mt-0.5" /> <strong className="text-foreground">Partager</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">3</span>
                <span>Sélectionnez <strong className="text-foreground">+ Envly</strong> dans la liste des actions</span>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-semibold shrink-0">4</span>
                <span>L&apos;article s&apos;ouvre dans Envly avec toutes les infos pré-remplies</span>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
