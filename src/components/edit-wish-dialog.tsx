"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (wish) {
      setTitle(wish.title);
      setUrl(wish.url || "");
      setDescription(wish.description || "");
      setImageUrl(wish.imageUrl || "");
      setPrice(wish.price ? String(wish.price) : "");
    }
  }, [wish]);

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
      }),
    });

    if (res.ok) {
      onUpdated();
      onOpenChange(false);
      toast.success("Wish updated!");
    } else {
      toast.error("Failed to update wish");
    }

    setSaving(false);
  };

  return (
    <Dialog open={!!wish} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit wish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-url">URL (optional)</Label>
            <Input
              id="edit-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you wish for?"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, size, or any details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Price (optional)</Label>
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
              <Label htmlFor="edit-imageUrl">Image URL (optional)</Label>
              <Input
                id="edit-imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-32 object-cover rounded-xl bg-muted/30"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          <Button type="submit" className="w-full rounded-xl" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
