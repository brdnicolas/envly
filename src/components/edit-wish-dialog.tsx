"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
  collectionId?: string;
}

interface Collection {
  id: string;
  name: string;
}

export function EditWishDialog({
  wish,
  onOpenChange,
  onUpdated,
}: {
  wish: Wish | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wish) {
      setTitle(wish.title);
      setUrl(wish.url || "");
      setDescription(wish.description || "");
      setImageUrl(wish.imageUrl || "");
      setPrice(wish.price ? String(wish.price) : "");
      setCollectionId(wish.collectionId || "");
      fetchCollections();
    }
  }, [wish]);

  const fetchCollections = async () => {
    const res = await fetch("/api/collections");
    if (res.ok) {
      const data = await res.json();
      setCollections(data);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const res = await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: dataUri }),
        });
        if (res.ok) {
          const { cdnUrl } = await res.json();
          setImageUrl(cdnUrl);
          toast.success("Image téléchargée !");
        } else {
          toast.error("Échec de l'upload");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Échec de l'upload");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish) return;
    setSaving(true);

    const res = await fetch(`/api/wishes/${wish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url: url || null,
        description: description || null,
        imageUrl: imageUrl || null,
        price: price || null,
        collectionId: collectionId || undefined,
      }),
    });

    if (res.ok) {
      onUpdated();
      onOpenChange(false);
      toast.success("Souhait mis à jour !");
    } else {
      toast.error("Échec de la mise à jour");
    }

    setSaving(false);
  };

  return (
    <Dialog open={!!wish} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le souhait</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-url">URL (optionnel)</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Titre</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que souhaitez-vous ?"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description (optionnelle)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Couleur, taille ou autres détails..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Prix (optionnel)</Label>
              <Input
                id="edit-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imageUrl ? (
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-xl bg-muted/30"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <ImagePlus className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground/30 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">Ajouter une image</span>
              </button>
            )}
            {uploading && (
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            )}
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={saving || uploading}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
