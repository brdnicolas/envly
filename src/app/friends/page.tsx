"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UserCard } from "@/components/user-card";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tab = "following" | "followers";

interface UserItem {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
  isFollowing: boolean;
}

interface SearchUser {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
  isFollowing: boolean;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "following", label: "Abonnements", icon: <UserCheck className="h-4 w-4" /> },
  { key: "followers", label: "Abonnés", icon: <Users className="h-4 w-4" /> },
];

export default function FriendsPage() {
  return (
    <Suspense>
      <FriendsPageContent />
    </Suspense>
  );
}

function FriendsPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "followers" ? "followers" : "following";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/follows/me?tab=${activeTab}`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) setSearchResults(await res.json());
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isSearching = query.trim().length >= 2;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Amis</h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un ami par nom ou e-mail..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {isSearching ? (
          /* Search results */
          <div>
            <p className="text-xs text-muted-foreground mb-3">
              {searching
                ? "Recherche..."
                : `${searchResults.length} résultat${searchResults.length !== 1 ? "s" : ""}`}
            </p>
            {!searching && searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted/50 mb-4">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur trouvé
                </p>
              </div>
            )}
            <div className="space-y-2">
              {searchResults.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        ) : (
          /* Friends list */
          <>
            <div className="flex gap-1 mb-4 rounded-xl bg-muted/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1 justify-center",
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border/60">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted/50 mb-4">
                  <Users className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "following"
                    ? "Vous ne suivez personne pour le moment"
                    : "Pas encore d'abonnés"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recherchez un ami ci-dessus pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
