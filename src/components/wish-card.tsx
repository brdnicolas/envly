"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelReservationButton, getReservationToken } from "@/components/reserve-dialog";
import { Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
  isPriority?: boolean;
  reservation?: { reservedBy: string } | null;
}

function getDomain(url: string | null) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

export function WishCard({
  wish,
  isOwner,
  onDeleted,
  onReserve,
  onEdit,
  onTogglePriority,
  onCancelReservation,
}: {
  wish: Wish;
  isOwner: boolean;
  onDeleted?: (id: string) => void;
  onReserve?: (wish: Wish) => void;
  onEdit?: (wish: Wish) => void;
  onTogglePriority?: (wish: Wish) => void;
  onCancelReservation?: (wishId: string) => void;
}) {
  const handleDelete = async () => {
    if (!confirm("Delete this wish?")) return;
    const res = await fetch(`/api/wishes/${wish.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.(wish.id);
      toast.success("Wish deleted");
    }
  };

  const isReserved = !!wish.reservation;
  const domain = getDomain(wish.url);

  return (
    <div
      className={`group relative flex flex-col rounded-lg overflow-hidden border border-border bg-card transition-shadow hover:shadow-md ${isReserved && !isOwner ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <a
        href={wish.url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`block overflow-hidden bg-muted/30 ${wish.url ? "cursor-pointer" : "cursor-default"}`}
      >
        {wish.imageUrl ? (
          <img
            src={wish.imageUrl}
            alt={wish.title}
            className="w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center">
            <span className="text-2xl text-muted-foreground/20">?</span>
          </div>
        )}
      </a>

      {/* Owner actions */}
      {isOwner && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background shadow-sm"
            onClick={() => onTogglePriority?.(wish)}
            title={wish.isPriority ? "Remove priority" : "Mark as priority"}
          >
            <Star className={`h-2.5 w-2.5 ${wish.isPriority ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          <button
            className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background shadow-sm"
            onClick={() => onEdit?.(wish)}
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background shadow-sm text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* Priority indicator */}
      {wish.isPriority && (
        <div className="absolute top-1.5 left-1.5">
          <div className="h-6 w-6 rounded-full bg-amber-400/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Star className="h-3 w-3 fill-white text-white" />
          </div>
        </div>
      )}

      {/* Reserved badge */}
      {!isOwner && isReserved && (
        <div className="absolute top-1.5 left-1.5">
          <Badge variant="secondary" className="text-[10px] shadow-sm px-1.5 py-0">
            Reserved by {wish.reservation?.reservedBy}
          </Badge>
        </div>
      )}

      {/* Info */}
      <div className="p-2 flex flex-col gap-0.5 flex-1">
        <h3 className="text-xs font-medium leading-tight line-clamp-2">{wish.title}</h3>
        <div className="flex items-center justify-between mt-auto pt-0.5">
          {domain && (
            <span className="text-[10px] text-muted-foreground truncate">{domain}</span>
          )}
          {wish.price != null && (
            <span className="text-xs font-semibold tabular-nums ml-auto">
              {wish.price.toFixed(2)}&euro;
            </span>
          )}
        </div>

        {!isOwner && !isReserved && (
          <Button
            variant="default"
            size="sm"
            className="w-full h-7 text-[11px] mt-1.5"
            onClick={() => onReserve?.(wish)}
          >
            Reserve
          </Button>
        )}
        {!isOwner && isReserved && getReservationToken(wish.id) && onCancelReservation && (
          <CancelReservationButton
            wishId={wish.id}
            onCancelled={onCancelReservation}
          />
        )}
      </div>
    </div>
  );
}
