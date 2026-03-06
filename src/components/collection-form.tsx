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
import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectionData {
  id: string;
  name: string;
  description: string | null;
  isPublic?: boolean;
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
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!collection;

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || "");
      setIsPublic(collection.isPublic ?? false);
    } else {
      setName("");
      setDescription("");
      setIsPublic(false);
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
      body: JSON.stringify({ name, description, isPublic }),
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
          <div className="space-y-1.5">
            <Label>Visibility</Label>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-200",
                isPublic
                  ? "border-primary bg-primary/5 text-foreground shadow-sm"
                  : "border-border/60 bg-transparent text-muted-foreground hover:border-foreground/20"
              )}
            >
              {isPublic ? (
                <Globe className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span className="font-medium">{isPublic ? "Public" : "Private"}</span>
              <span className="text-xs ml-auto">
                {isPublic ? "Anyone with the link can see it" : "Only you can see it"}
              </span>
            </button>
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
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
