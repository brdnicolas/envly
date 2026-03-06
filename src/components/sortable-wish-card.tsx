"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WishCard } from "@/components/wish-card";
import { GripVertical } from "lucide-react";

interface Wish {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  imageOriginalUrl?: string | null;
  price: number | null;
  isPriority?: boolean;
}

export function SortableWishCard({
  wish,
  onDeleted,
  onEdit,
  onTogglePriority,
}: {
  wish: Wish;
  onDeleted: (id: string) => void;
  onEdit: (wish: Wish) => void;
  onTogglePriority: (wish: Wish) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wish.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      <button
        className="absolute top-1.5 left-1.5 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      <WishCard
        wish={wish}
        isOwner={true}
        onDeleted={onDeleted}
        onEdit={onEdit}
        onTogglePriority={onTogglePriority}
      />
    </div>
  );
}
