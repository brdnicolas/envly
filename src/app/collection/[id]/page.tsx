"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SortableWishCard } from "@/components/sortable-wish-card";
import { WishCard } from "@/components/wish-card";
import { EditWishDialog } from "@/components/edit-wish-dialog";
import { CollectionForm } from "@/components/collection-form";
import { InviteCollaboratorsDialog } from "@/components/invite-collaborators-dialog";
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
import { Plus, ArrowLeft, Copy, Pencil, Users, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  imageOriginalUrl?: string | null;
  price: number | null;
  isPriority?: boolean;
  collectionId?: string;
  creatorId?: string | null;
  creator?: { id: string; name: string | null } | null;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  wishes: Wish[];
  role: "owner" | "collaborator";
}

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const navigateToAdd = () => router.push(`/add?collectionId=${id}`);
  const [showEditCollection, setShowEditCollection] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [leavingCollab, setLeavingCollab] = useState(false);

  const isOwner = collection?.role === "owner";
  const isCollaborator = collection?.role === "collaborator";
  const currentUserId = session?.user?.id;

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
      toast.success(collection.isPublic ? "Collection maintenant privée" : "Collection maintenant publique");
    }
  };

  const copyShareLink = () => {
    if (!collection) return;
    navigator.clipboard.writeText(`${window.location.origin}/w/${collection.slug}`);
    toast.success("Lien copié !");
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
    const newPriority = !wish.isPriority;
    setCollection({
      ...collection,
      wishes: collection.wishes.map((w) =>
        w.id === wish.id ? { ...w, isPriority: newPriority } : w
      ),
    });
    toast.success(newPriority ? "Marqué comme prioritaire" : "Priorité retirée");
    const res = await fetch(`/api/wishes/${wish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPriority: newPriority }),
    });
    if (!res.ok) {
      setCollection((prev) =>
        prev
          ? { ...prev, wishes: prev.wishes.map((w) => (w.id === wish.id ? { ...w, isPriority: wish.isPriority } : w)) }
          : prev
      );
      toast.error("Échec de la mise à jour");
    }
  };

  const handleLeaveCollab = async () => {
    if (!collection || !currentUserId) return;
    setLeavingCollab(true);

    // Find my collaborator record
    const collabRes = await fetch(`/api/collections/${id}/collaborators`);
    // As a collaborator we can't list collaborators (owner only),
    // so we need a different approach. We'll look for our own record.
    // Actually the GET is owner-only, so let's call the API differently.
    // We need to find our collaborator ID. Let's fetch it via a workaround.

    // Actually let's update the backend to also allow a collaborator to see their own record.
    // For now, let's just add a query param approach. Instead, let's add a dedicated endpoint.
    // Simplest: try to find and delete via a special route. But we already have DELETE.
    // The issue is we need the collaboratorId. Let's update the GET to also work for collaborators
    // for their own record, or we store collaboratorId in the collection response.

    // For simplicity, let's fetch all collaborators from the collection detail and find ours.
    // But we don't have collaborators in the collection response. Let me refactor:
    // Add a simpler approach - search through the collection endpoint.
    // Actually, the simplest fix: let's make a special "leave" call.

    try {
      // We'll use a trick: try to list collaborators (will fail if not owner),
      // If that fails, we use the notification data approach.
      // Better: just add a "leave" endpoint or make collaborator able to see their own.
      // Simplest approach: POST to a leave endpoint that finds and deletes own record.
      const res = await fetch(`/api/collections/${id}/collaborators/leave`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Vous avez quitté la collaboration");
        router.push("/dashboard");
      } else {
        toast.error("Erreur");
      }
    } catch {
      toast.error("Erreur");
    }
    setLeavingCollab(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <Skeleton className="h-8 w-16 mb-4 rounded-xl" />
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <Skeleton className="w-full aspect-[3/4]" />
                <div className="p-3 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!collection) return null;

  const canEditWish = (wish: Wish) => {
    if (isOwner) return true;
    if (isCollaborator && wish.creatorId === currentUserId) return true;
    return false;
  };

  const wishGrid = (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
      <button
        onClick={() => navigateToAdd()}
        className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-card aspect-[3/4] text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
      >
        <div className="h-12 w-12 rounded-2xl border-2 border-current flex items-center justify-center">
          <Plus className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">Ajouter un souhait</span>
      </button>
      {collection.wishes.map((wish) =>
        isOwner ? (
          <SortableWishCard
            key={wish.id}
            wish={wish}
            onDeleted={handleWishDeleted}
            onEdit={(w) => setEditingWish(w)}
            onTogglePriority={handleTogglePriority}
          />
        ) : (
          <div key={wish.id}>
            <WishCard
              wish={wish}
              isOwner={canEditWish(wish)}
              hideReservation
              onDeleted={handleWishDeleted}
              onEdit={(w) => setEditingWish(w)}
              onTogglePriority={handleTogglePriority}
              creatorName={wish.creator?.name || undefined}
            />
          </div>
        )
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 rounded-xl"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-2">
            <div>
              <h1 className="text-2xl font-semibold">{collection.name}</h1>
              {collection.description && (
                <p className="text-muted-foreground text-sm mt-1">{collection.description}</p>
              )}
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 mt-0.5 rounded-xl"
                onClick={() => setShowEditCollection(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isOwner && (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    id="public"
                    checked={collection.isPublic}
                    onCheckedChange={togglePublic}
                  />
                  <Label htmlFor="public" className="text-sm">Publique</Label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={copyShareLink}
                  disabled={!collection.isPublic}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Partager
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Inviter
                </Button>
              </>
            )}

            {isCollaborator && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive hover:text-destructive"
                onClick={handleLeaveCollab}
                disabled={leavingCollab}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Quitter
              </Button>
            )}

            <Button size="sm" className="rounded-xl" onClick={() => navigateToAdd()}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        {isOwner ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={collection.wishes.map((w) => w.id)} strategy={rectSortingStrategy}>
              {wishGrid}
            </SortableContext>
          </DndContext>
        ) : (
          wishGrid
        )}

        {isOwner && (
          <CollectionForm
            open={showEditCollection}
            onOpenChange={setShowEditCollection}
            onSuccess={fetchCollection}
            collection={collection}
          />
        )}

        <InviteCollaboratorsDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          collectionId={collection.id}
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
