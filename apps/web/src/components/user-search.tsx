"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { UserCard } from "@/components/user-card";
import { Search } from "lucide-react";

interface SearchUser {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
  isFollowing: boolean;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou e-mail..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      {loading && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Recherche...
        </p>
      )}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Aucun utilisateur trouvé
        </p>
      )}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
