"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, ExternalLink, ImageIcon, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  _count: { wishes: number };
  wishes?: { imageUrl: string | null }[];
}

export function ImageMosaic({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="w-full aspect-[2/1] bg-muted/20 flex items-center justify-center rounded-t-2xl">
        <ImageIcon className="h-8 w-8 text-muted-foreground/15" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="w-full aspect-[2/1] rounded-t-2xl overflow-hidden">
        <img src={images[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="w-full aspect-[2/1] rounded-t-2xl overflow-hidden grid grid-cols-2 gap-px bg-border/40">
        {images.map((img, i) => (
          <img key={i} src={img} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="w-full aspect-[2/1] rounded-t-2xl overflow-hidden grid grid-cols-3 gap-px bg-border/40">
        {images.map((img, i) => (
          <img key={i} src={img} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  // 4+ images: grid 3x2
  const slots = images.slice(0, 6);

  return (
    <div className="w-full aspect-[2/1] rounded-t-2xl overflow-hidden grid grid-cols-3 grid-rows-2 gap-px bg-border/40">
      {slots.map((img, i) => (
        <img key={i} src={img} alt="" className="w-full h-full object-cover" />
      ))}
      {Array.from({ length: Math.max(0, 6 - slots.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="bg-muted/20" />
      ))}
    </div>
  );
}

export function CollectionCard({
  collection,
  onDeleted,
}: {
  collection: Collection;
  onDeleted: (id: string) => void;
}) {
  const handleDelete = async () => {
    if (!confirm("Delete this collection and all its wishes?")) return;

    const res = await fetch(`/api/collections/${collection.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onDeleted(collection.id);
      toast.success("Collection deleted");
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/w/${collection.slug}`
    );
    toast.success("Share link copied!");
  };

  const images = (collection.wishes || [])
    .map((w) => w.imageUrl)
    .filter((url): url is string => !!url);

  return (
    <div className="group rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-foreground/15">
      <Link href={`/collection/${collection.id}`}>
        <ImageMosaic images={images} />
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/collection/${collection.id}`} className="flex-1 min-w-0">
            <h3 className="font-medium truncate hover:underline underline-offset-4">
              {collection.name}
            </h3>
          </Link>
          {collection.isPublic && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 -mt-0.5 rounded-xl"
              onClick={copyShareLink}
              title="Copy share link"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-0.5 rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {collection.isPublic && (
                <DropdownMenuItem onClick={copyShareLink}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Copy share link
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {collection.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {collection.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-xs text-muted-foreground">
            {collection._count.wishes} wish{collection._count.wishes !== 1 ? "es" : ""}
          </span>
          <Badge
            variant={collection.isPublic ? "default" : "secondary"}
            className="text-[10px] px-2 py-0.5 rounded-lg"
          >
            {collection.isPublic ? "Public" : "Private"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
