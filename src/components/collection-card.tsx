"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  _count: { wishes: number };
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

  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <Link href={`/collection/${collection.id}`} className="flex-1 min-w-0">
          <CardTitle className="text-base truncate hover:underline underline-offset-4">
            {collection.name}
          </CardTitle>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      </CardHeader>
      <CardContent>
        <Link href={`/collection/${collection.id}`}>
          {collection.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {collection.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {collection._count.wishes} wish{collection._count.wishes !== 1 ? "es" : ""}
            </span>
            <Badge variant={collection.isPublic ? "default" : "secondary"} className="text-xs">
              {collection.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
