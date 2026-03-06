"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CollectionCard, ImageMosaic } from "@/components/collection-card";
import { CollectionForm } from "@/components/collection-form";
import { Plus, Puzzle, X, Copy, Check, Settings, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  _count: { wishes: number };
  wishes: { imageUrl: string | null }[];
  role?: "owner" | "collaborator";
}

interface FriendOwner {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
}

interface FriendCollection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  owner: FriendOwner;
  _count: { wishes: number };
  wishes: { imageUrl: string | null }[];
}

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  description: string | null;
  slug: string | null;
}

type Tab = "mine" | "friends";

function FriendCollectionCard({ col }: { col: FriendCollection }) {
  const images = col.wishes
    .map((w) => w.imageUrl)
    .filter((url): url is string => !!url);

  return (
    <Link
      href={`/w/${col.slug}`}
      className="group w-44 sm:w-52 shrink-0 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-foreground/15"
    >
      <ImageMosaic images={images} />
      <div className="p-3">
        <h3 className="font-medium truncate text-sm group-hover:underline underline-offset-4">
          {col.name}
        </h3>
        <span className="text-xs text-muted-foreground">
          {col._count.wishes} souhait{col._count.wishes !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}

function FriendSection({
  owner,
  collections,
}: {
  owner: FriendOwner;
  collections: FriendCollection[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-9 w-9 shrink-0">
          {owner.image ? <AvatarImage src={owner.image} alt={owner.name || ""} /> : null}
          <AvatarFallback className="text-sm">
            {owner.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{owner.name || "Anonyme"}</p>
          <p className="text-xs text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        {owner.slug && (
          <Link
            href={`/u/${owner.slug}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Voir le profil
          </Link>
        )}
      </div>
      {visible ? (
        <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
          {collections.map((col) => (
            <FriendCollectionCard key={col.id} col={col} />
          ))}
        </div>
      ) : (
        <div className="h-28 sm:h-32" />
      )}
    </div>
  );
}

function FriendsTab({
  loading,
  collections,
  followingCount,
}: {
  loading: boolean;
  collections: FriendCollection[];
  followingCount: number;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted/50 mb-4">
          <Settings className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">
          {followingCount === 0
            ? "Suivez des utilisateurs pour voir leurs collections ici"
            : "Pas encore de collections publiques de vos amis"}
        </p>
      </div>
    );
  }

  // Group by owner
  const friendsMap = new Map<string, { owner: FriendOwner; collections: FriendCollection[] }>();
  for (const col of collections) {
    const existing = friendsMap.get(col.owner.id);
    if (existing) {
      existing.collections.push(col);
    } else {
      friendsMap.set(col.owner.id, { owner: col.owner, collections: [col] });
    }
  }
  const groups = Array.from(friendsMap.values());

  return (
    <div className="space-y-8">
      {groups.map(({ owner, collections: cols }) => (
        <FriendSection key={owner.id} owner={owner} collections={cols} />
      ))}
    </div>
  );
}

export function DashboardView() {
  const { data: session } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [friendCollections, setFriendCollections] = useState<FriendCollection[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("mine");
  const [slugCopied, setSlugCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const [showExtensionBanner, setShowExtensionBanner] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("envly-extension-banner-dismissed") !== "true") {
      setShowExtensionBanner(true);
    }
  }, []);

  const fetchCollections = async () => {
    const res = await fetch("/api/collections");
    const data = await res.json();
    setCollections(data);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  };

  const fetchStats = async () => {
    const res = await fetch("/api/follows/me?tab=stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const fetchFriendCollections = async () => {
    setFriendsLoading(true);
    const res = await fetch("/api/follows/me?tab=friends-collections");
    if (res.ok) {
      setFriendCollections(await res.json());
    }
    setFriendsLoading(false);
  };

  useEffect(() => {
    fetchCollections();
    fetchProfile();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "friends" && friendCollections.length === 0 && !friendsLoading) {
      fetchFriendCollections();
    }
  }, [activeTab]);

  const handleDeleted = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCopyLink = () => {
    if (!profile?.slug) return;
    navigator.clipboard.writeText(`${origin}/u/${profile.slug}`);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Profile section */}
        {!profile && (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-10 pb-8 border-b border-border/60">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        )}
        {profile && (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-10 pb-8 border-b border-border/60">
            <Avatar className="h-16 w-16">
              {profile.image ? <AvatarImage src={profile.image} alt={profile.name || ""} /> : null}
              <AvatarFallback className="text-xl">
                {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-semibold">{profile.name || "Anonyme"}</h1>
              {profile.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{profile.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start">
                <span className="text-sm">
                  <span className="font-medium">{stats.followingCount}</span>{" "}
                  <span className="text-muted-foreground">abonnements</span>
                </span>
                <span className="text-sm">
                  <span className="font-medium">{stats.followersCount}</span>{" "}
                  <span className="text-muted-foreground">
                    abonné{stats.followersCount !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-muted-foreground text-sm">&middot;</span>
                <span className="text-sm text-muted-foreground">
                  {collections.length} collection{collections.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {profile.slug ? (
                <>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {origin}/u/{profile.slug}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl" onClick={handleCopyLink}>
                    {slugCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </>
              ) : (
                <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  Configurez votre pseudo pour partager votre profil
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Extension banner */}
        {showExtensionBanner && (
          <div className="relative flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4 mb-6 transition-all duration-300 hover:shadow-md">
            <div className="h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
              <Puzzle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Ajoutez des souhaits plus vite avec notre extension Chrome</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Parcourez n&apos;importe quelle boutique et enregistrez des articles en un clic.
              </p>
            </div>
            <a
              href="https://chromewebstore.google.com/detail/nfchfkcbbiedjgiebgfhlkondnekfdjp"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Installer
            </a>
            <button
              onClick={() => {
                setShowExtensionBanner(false);
                localStorage.setItem("envly-extension-banner-dismissed", "true");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tabs + New button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
            <button
              onClick={() => setActiveTab("mine")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === "mine"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mes collections
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                activeTab === "friends"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Amis
            </button>
          </div>
          {activeTab === "mine" && (
            <Button onClick={() => setShowForm(true)} size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-1" />
              Nouveau
            </Button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === "mine" ? (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <Skeleton className="w-full aspect-[16/9]" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/50 mb-4">
                <Plus className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-4">Pas encore de collection</p>
              <Button onClick={() => setShowForm(true)} variant="outline" className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première collection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )
        ) : (
          <FriendsTab
            loading={friendsLoading}
            collections={friendCollections}
            followingCount={stats.followingCount}
          />
        )}

        <CollectionForm
          open={showForm}
          onOpenChange={setShowForm}
          onSuccess={fetchCollections}
        />
      </main>
      <Footer />
    </div>
  );
}
