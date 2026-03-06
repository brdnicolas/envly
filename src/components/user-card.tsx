"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:shadow-md hover:border-foreground/15">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback>
            {user.name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {user.slug ? (
            <Link
              href={`/u/${user.slug}`}
              className="font-medium text-sm hover:underline underline-offset-4 truncate block"
            >
              {user.name || "Anonymous"}
            </Link>
          ) : (
            <span className="font-medium text-sm truncate block">
              {user.name || "Anonymous"}
            </span>
          )}
        </div>
      </div>
      <FollowButton
        type="user"
        targetId={user.id}
        initialFollowing={user.isFollowing}
      />
    </div>
  );
}
