"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Heart, HeartOff } from "lucide-react";

interface FollowButtonProps {
  type: "user" | "collection";
  targetId: string;
  initialFollowing: boolean;
  size?: "sm" | "default";
}

export function FollowButton({
  type,
  targetId,
  initialFollowing,
  size = "sm",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const endpoint =
        type === "user" ? "/api/follows/users" : "/api/follows/collections";
      const body =
        type === "user"
          ? { userId: targetId }
          : { collectionId: targetId };

      const res = await fetch(endpoint, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } finally {
      setLoading(false);
    }
  };

  if (type === "collection") {
    return (
      <Button
        variant={isFollowing ? "outline" : "default"}
        size={size}
        onClick={toggle}
        disabled={loading}
        className="rounded-xl"
      >
        {isFollowing ? (
          <>
            <HeartOff className="h-4 w-4 mr-1.5" />
            Unfollow
          </>
        ) : (
          <>
            <Heart className="h-4 w-4 mr-1.5" />
            Follow
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size={size}
      onClick={toggle}
      disabled={loading}
      className="rounded-xl"
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-1.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Follow
        </>
      )}
    </Button>
  );
}
