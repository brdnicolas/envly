"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SortableWishCard } from "@/components/sortable-wish-card";
import { EditWishDialog } from "@/components/edit-wish-dialog";
import { CollectionForm } from "@/components/collection-form";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ArrowLeft, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  imageOriginalUrl?: string | null;
  price: number | null;
  isPriority: boolean;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  wishes: Wish[];
}

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const navigateToAdd = () => router.push(`/add?collectionId=${id}`);
  const [showEditCollection, setShowEditCollection] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !collection) return;

      const wishes = [...collection.wishes];
      const oldIndex = wishes.findIndex((w) => w.id === active.id);
      const newIndex = wishes.findIndex((w) => w.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const [moved] = wishes.splice(oldIndex, 1);
      wishes.splice(newIndex, 0, moved);

      setCollection({ ...collection, wishes });

      // Persist in background
      fetch("/api/wishes/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: collection.id,
          orderedIds: wishes.map((w) => w.id),
        }),
      });
    },
    [collection]
  );

  const fetchCollection = async () => {
    const res = await fetch(`/api/collections/${id}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setCollection(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const togglePublic = async () => {
    if (!collection) return;
    const res = await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !collection.isPublic }),
    });
    if (res.ok) {
      setCollection({ ...collection, isPublic: !collection.isPublic });
      toast.success(collection.isPublic ? "Collection is now private" : "Collection is now public");
    }
  };

  const copyShareLink = () => {
    if (!collection) return;
    navigator.clipboard.writeText(`${window.location.origin}/w/${collection.slug}`);
    toast.success("Share link copied!");
  };

  const handleWishDeleted = (wishId: string) => {
    if (!collection) return;
    setCollection({
      ...collection,
      wishes: collection.wishes.filter((w) => w.id !== wishId),
    });
  };

  const handleTogglePriority = async (wish: Wish) => {
    if (!collection) return;
    const res = await fetch(`/api/wishes/${wish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPriority: !wish.isPriority }),
    });
    if (res.ok) {
      setCollection({
        ...collection,
        wishes: collection.wishes.map((w) =>
          w.id === wish.id ? { ...w, isPriority: !w.isPriority } : w
        ),
      });
      toast.success(wish.isPriority ? "Priority removed" : "Marked as priority");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="text-2xl font-semibold">{collection.name}</h1>
              {collection.description && (
                <p className="text-muted-foreground text-sm mt-1">{collection.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 mt-0.5"
              onClick={() => setShowEditCollection(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Switch
                id="public"
                checked={collection.isPublic}
                onCheckedChange={togglePublic}
              />
              <Label htmlFor="public" className="text-sm">Public</Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              disabled={!collection.isPublic}
            >
              <Copy className="h-4 w-4 mr-1" />
              Share
            </Button>

            <Button size="sm" onClick={() => navigateToAdd()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={collection.wishes.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
              <button
                onClick={() => navigateToAdd()}
                className="w-full flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-card aspect-[3/4] text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full border-2 border-current flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Add a wish</span>
              </button>
              {collection.wishes.map((wish) => (
                <SortableWishCard
                  key={wish.id}
                  wish={wish}
                  onDeleted={handleWishDeleted}
                  onEdit={(w) => setEditingWish(w)}
                  onTogglePriority={handleTogglePriority}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>


        <CollectionForm
          open={showEditCollection}
          onOpenChange={setShowEditCollection}
          onSuccess={fetchCollection}
          collection={collection}
        />

        <EditWishDialog
          wish={editingWish}
          onOpenChange={(open) => !open && setEditingWish(null)}
          onUpdated={fetchCollection}
        />
      </main>
      <Footer />
    </div>
  );
}
