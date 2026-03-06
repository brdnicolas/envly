"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Mail, LayoutGrid, Settings, LogOut, Users } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

interface SearchUser {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
}

function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-full"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-48 pl-8 text-sm rounded-xl"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setOpen(false);
            setQuery("");
            setResults([]);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {(results.length > 0 || loading || (query.trim().length >= 2 && !loading)) && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl z-50 overflow-hidden">
          {loading && (
            <p className="text-xs text-muted-foreground p-3">Recherche...</p>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-xs text-muted-foreground p-3">Aucun utilisateur trouvé</p>
          )}
          {results.map((user) => (
            <Link
              key={user.id}
              href={user.slug ? `/u/${user.slug}` : "#"}
              className="flex items-center gap-2.5 p-2.5 hover:bg-accent/50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Avatar className="h-8 w-8 shrink-0">
                {user.image ? <AvatarImage src={user.image} alt={user.name || ""} /> : null}
                <AvatarFallback className="text-xs">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">
                {user.name || "Anonyme"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold text-lg">
          <Logo className="h-7 w-7" />
          Envly
        </Link>

        <div className="flex items-center gap-1.5">
          {session ? (
            <>
              <Button variant="ghost" size="icon" className="rounded-full" asChild>
                <Link href="/friends">
                  <Users className="h-4 w-4" />
                </Link>
              </Button>
              <HeaderSearch />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      {session.user?.image ? <AvatarImage src={session.user.image} alt={session.user.name || ""} /> : null}
                      <AvatarFallback className="text-xs">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground text-xs" disabled>
                    <Mail className="h-4 w-4" />
                    {session.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Mes collections
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Connexion</Link>
              </Button>
              <Button size="sm" className="rounded-xl" asChild>
                <Link href="/signup">S&apos;inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
