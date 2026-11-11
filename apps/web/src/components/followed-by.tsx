import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Follower {
  name: string | null;
  image: string | null;
}

interface FollowedByProps {
  followers: Follower[];
  totalCount: number;
}

export function FollowedBy({ followers, totalCount }: FollowedByProps) {
  if (totalCount === 0) return null;

  const remaining = totalCount - followers.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {followers.map((f, i) => (
          <Avatar key={i} className="h-6 w-6 border-2 border-background">
            <AvatarFallback className="text-[10px]">
              {f.name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        Suivi par {followers[0]?.name || "quelqu'un"}
        {remaining > 0 && ` et ${remaining} autre${remaining !== 1 ? "s" : ""}`}
      </span>
    </div>
  );
}
