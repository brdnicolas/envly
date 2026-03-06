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
import { Plus, Puzzle, X, Copy, Check, Settings } from "lucide-react";
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
      className="group w-44 sm:w-52 shrink-0 snap-start rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
    >
      <ImageMosaic images={images} />
      <div className="p-3">
        <h3 className="font-medium truncate text-sm group-hover:underline underline-offset-4">
          {col.name}
        </h3>
        <span className="text-xs text-muted-foreground">
          {col._count.wishes} wish{col._count.wishes !== 1 ? "es" : ""}
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
          <p className="text-sm font-medium truncate">{owner.name || "Anonymous"}</p>
          <p className="text-xs text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        {owner.slug && (
          <Link
            href={`/u/${owner.slug}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            View profile
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
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          {followingCount === 0
            ? "Follow users to see their collections here"
            : "No public collections from your friends yet"}
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

export default function DashboardPage() {
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
        {profile && (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-10 pb-8 border-b border-border">
            <Avatar className="h-16 w-16">
              {profile.image ? <AvatarImage src={profile.image} alt={profile.name || ""} /> : null}
              <AvatarFallback className="text-xl">
                {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-semibold">{profile.name || "Anonymous"}</h1>
              {profile.description && (
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
              <div className="flex items-center gap-3 mt-1.5 justify-center sm:justify-start">
                <span className="text-sm">
                  <span className="font-medium">{stats.followingCount}</span>{" "}
                  <span className="text-muted-foreground">following</span>
                </span>
                <span className="text-sm">
                  <span className="font-medium">{stats.followersCount}</span>{" "}
                  <span className="text-muted-foreground">
                    follower{stats.followersCount !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-muted-foreground text-sm">·</span>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyLink}>
                    {slugCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </>
              ) : (
                <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  Set up your username to share your profile
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Extension banner */}
        {showExtensionBanner && (
          <div className="relative flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 mb-6">
            <Puzzle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Add wishes faster with our Chrome extension</p>
              <p className="text-xs text-muted-foreground">
                Browse any store and save items to your wishlist in one click — no copy-pasting needed.
              </p>
            </div>
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
          <div className="flex gap-1 border-b border-border -mb-px">
            <button
              onClick={() => setActiveTab("mine")}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "mine"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              My Collections
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === "friends"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Friends
            </button>
          </div>
          {activeTab === "mine" && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === "mine" ? (
          loading ? (
            <div className="text-muted-foreground text-sm">Loading...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">No collections yet</p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create your first collection
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
