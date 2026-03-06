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
  imageOriginalUrl?: string | null;
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
      className={`group relative flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card transition-all duration-300 hover:shadow-lg hover:border-foreground/15 ${isReserved && !isOwner ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <a
        href={wish.url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`block overflow-hidden bg-muted/20 ${wish.url ? "cursor-pointer" : "cursor-default"}`}
      >
        {wish.imageUrl ? (
          <img
            src={wish.imageUrl}
            alt={wish.title}
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              if (wish.imageOriginalUrl && e.currentTarget.src !== wish.imageOriginalUrl) {
                e.currentTarget.src = wish.imageOriginalUrl;
              } else {
                e.currentTarget.style.display = "none";
              }
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
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            className="h-7 w-7 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background shadow-sm transition-colors"
            onClick={() => onTogglePriority?.(wish)}
            title={wish.isPriority ? "Remove priority" : "Mark as priority"}
          >
            <Star className={`h-3 w-3 ${wish.isPriority ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          <button
            className="h-7 w-7 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background shadow-sm transition-colors"
            onClick={() => onEdit?.(wish)}
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="h-7 w-7 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background shadow-sm text-destructive transition-colors"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Priority indicator */}
      {wish.isPriority && (
        <div className="absolute top-2 left-2">
          <div className="h-7 w-7 rounded-xl bg-amber-400/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Star className="h-3 w-3 fill-white text-white" />
          </div>
        </div>
      )}

      {/* Reserved badge */}
      {!isOwner && isReserved && (
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-[10px] shadow-sm px-2 py-0.5 rounded-lg backdrop-blur-sm">
            Reserved by {wish.reservation?.reservedBy}
          </Badge>
        </div>
      )}

      {/* Info */}
      <div className="p-3 flex flex-col gap-0.5 flex-1">
        <h3 className="text-xs font-medium leading-tight line-clamp-2">{wish.title}</h3>
        <div className="flex items-center justify-between mt-auto pt-1">
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
            className="w-full h-7 text-[11px] mt-2 rounded-xl"
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
