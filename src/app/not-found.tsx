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
        <FileQuestion className="h-16 w-16 text-muted-foreground/40 mb-6" />
        <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
