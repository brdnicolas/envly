"use client";

import { ArrowRight, Check, Chrome, Laptop } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EXTENSION_URL, useExtension } from "@/lib/extension";

/**
 * "Ajouter à Chrome" that adapts to the visitor:
 * installed → confirmation · desktop Chromium → Web Store · elsewhere (phone, Safari) → explains it's for desktop.
 */
export function ExtensionCta({ size = "lg", className, showHint = true }: { size?: "default" | "lg"; className?: string; showHint?: boolean }) {
  const { installed, supported } = useExtension();
  const h = size === "lg" ? "h-12 px-6 text-[15px]" : "h-10 px-4";

  if (installed) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <span className={cn("inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-400", h)}>
          <Check className="h-4 w-4" /> Extension installée
        </span>
        {showHint && <p className="text-sm text-muted-foreground">Ouvrez une fiche produit : le bouton Envly vous attend.</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button size="lg" className={cn("group w-fit rounded-full", h)} asChild>
        <a href={EXTENSION_URL} target="_blank" rel="noopener noreferrer">
          <Chrome className="h-4 w-4" />
          Ajouter à Chrome, c’est gratuit
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </Button>
      {showHint && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {supported ? (
            "Chrome, Edge, Brave, Arc… · 10 secondes à installer"
          ) : (
            <>
              <Laptop className="h-3.5 w-3.5" /> Sur ordinateur. Sur iPhone,{" "}
              <Link href="/install" className="underline underline-offset-4 hover:text-foreground">
                utilisez l’app
              </Link>
              .
            </>
          )}
        </p>
      )}
    </div>
  );
}
