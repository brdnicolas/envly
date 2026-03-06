"use client";

import { useState, useRef, useCallback } from "react";
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
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function isValidUrl(str: string) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function AddWishDialog({
  open,
  onOpenChange,
  collectionId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  onCreated: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastScrapedUrl = useRef("");

  const scrapeUrl = useCallback(async (targetUrl: string) => {
    if (!targetUrl || !isValidUrl(targetUrl)) return;
    if (targetUrl === lastScrapedUrl.current) return;
    lastScrapedUrl.current = targetUrl;
    setScraping(true);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.images?.length) setImages(data.images);
        const bestImage = data.imageUrl || data.images?.[0] || "";
        if (bestImage) setImageUrl(bestImage);
        if (data.price) setPrice(String(data.price));
        toast.success("Page info loaded!");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Could not scrape this URL");
      }
    } catch {
      toast.error("Failed to fetch URL");
    }

    setScraping(false);
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);

    if (isValidUrl(value) && value !== lastScrapedUrl.current) {
      scrapeUrl(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url: url || null,
        description: description || null,
        imageUrl: imageUrl || null,
        price: price || null,
        collectionId,
      }),
    });

    if (res.ok) {
      setUrl("");
      setTitle("");
      setDescription("");
      setImageUrl("");
      setPrice("");
      setImages([]);
      lastScrapedUrl.current = "";
      onCreated();
      onOpenChange(false);
      toast.success("Wish added!");
    } else {
      toast.error("Failed to add wish");
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a wish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL (optional — paste to auto-fill)</Label>
            <div className="relative">
              <Input
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="Paste a product link to auto-fill..."
              />
              {scraping && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {images.length > 0 && (
            <div className="space-y-1.5">
              <Label>Select an image</Label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto rounded-md border p-2">
                {images.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setImageUrl(img)}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:opacity-90",
                      imageUrl === img
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent"
                    )}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                    {imageUrl === img && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you wish for?"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wish-description">Description (optional)</Label>
            <Textarea
              id="wish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Color, size, or any details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="29.99"
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving || scraping}>
            {saving ? "Adding..." : "Add wish"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
