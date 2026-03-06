"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collection-card";
import { CollectionForm } from "@/components/collection-form";
import { Plus } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  createdAt: string;
  _count: { wishes: number };
}

export default function DashboardPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchCollections = async () => {
    const res = await fetch("/api/collections");
    const data = await res.json();
    setCollections(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleDeleted = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">My Collections</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage your wishlists
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New collection
          </Button>
        </div>

        {loading ? (
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
