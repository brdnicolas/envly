"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/follow-button";

interface UserCardProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    slug: string | null;
    isFollowing: boolean;
  };
}

export function UserCard({ user }: UserCardProps) {
  const content = (
    <>
      <Avatar className="h-10 w-10 shrink-0">
        {user.image ? (
          <AvatarImage src={user.image} alt={user.name || ""} />
        ) : null}
        <AvatarFallback>
          {user.name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <span className="font-medium text-sm truncate block">
          {user.name || "Anonyme"}
        </span>
        {user.slug && (
          <span className="text-xs text-muted-foreground truncate block">
            @{user.slug}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:shadow-md hover:border-foreground/15">
      <Link href={`/u/${user.slug || user.id}`} className="flex items-center gap-3 min-w-0 flex-1">
        {content}
      </Link>
      <FollowButton
        type="user"
        targetId={user.id}
        initialFollowing={user.isFollowing}
      />
    </div>
  );
}
