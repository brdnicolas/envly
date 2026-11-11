import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-muted/50 mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Page introuvable</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Button className="rounded-xl" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
