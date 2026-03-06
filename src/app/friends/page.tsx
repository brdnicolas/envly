"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UserSearch } from "@/components/user-search";
import { UserCard } from "@/components/user-card";
import Link from "next/link";
import { Users, UserCheck, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tab = "following" | "followers" | "collections";

interface UserItem {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
  isFollowing: boolean;
}

interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  ownerName: string | null;
  wishCount: number;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "following", label: "Following", icon: <UserCheck className="h-4 w-4" /> },
  { key: "followers", label: "Followers", icon: <Users className="h-4 w-4" /> },
  { key: "collections", label: "Collections", icon: <Heart className="h-4 w-4" /> },
];

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("following");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/follows/me?tab=${activeTab}`)
      .then((res) => res.json())
      .then((data) => {
        if (activeTab === "collections") {
          setCollections(data);
        } else {
          setUsers(data);
        }
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Friends</h1>

        <UserSearch />

        <div className="flex gap-1 mt-8 mb-4 rounded-xl bg-muted/50 p-1">
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
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-border/60">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "collections" ? (
          collections.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted/50 mb-4">
                <Heart className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                No followed collections yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/w/${col.slug}`}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:shadow-md hover:border-foreground/15"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{col.name}</p>
                    {col.ownerName && (
                      <p className="text-xs text-muted-foreground">
                        by {col.ownerName}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-3">
                    {col.wishCount} wish{col.wishCount !== 1 ? "es" : ""}
                  </span>
                </Link>
              ))}
            </div>
          )
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted/50 mb-4">
              <Users className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeTab === "following"
                ? "You're not following anyone yet"
                : "No followers yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
