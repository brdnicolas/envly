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

interface CollectionData {
  id: string;
  name: string;
  description: string | null;
}

export function CollectionForm({
  open,
  onOpenChange,
  onSuccess,
  collection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  collection?: CollectionData | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit = !!collection;

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [collection, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = isEdit ? `/api/collections/${collection.id}` : "/api/collections";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (res.ok) {
      if (!isEdit) {
        setName("");
        setDescription("");
      }
      onSuccess();
      onOpenChange(false);
      toast.success(isEdit ? "Collection updated!" : "Collection created!");
    } else {
      toast.error(isEdit ? "Failed to update collection" : "Failed to create collection");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Birthday wishlist"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-description">Description (optional)</Label>
            <Textarea
              id="col-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Things I'd love for my birthday"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isEdit ? "Saving..." : "Creating..."
              : isEdit ? "Save changes" : "Create collection"
            }
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
