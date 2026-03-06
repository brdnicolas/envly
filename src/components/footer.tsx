import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Envly &mdash; Share wishlists, keep surprises.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/signin" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
