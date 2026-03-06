"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, X, Clock, Check } from "lucide-react";
import { toast } from "sonner";

interface Friend {
  id: string;
  name: string | null;
  image: string | null;
  slug: string | null;
}

interface Collaborator {
  id: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  user: Friend;
}

export function InviteCollaboratorsDialog({
  open,
  onOpenChange,
  collectionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch("/api/follows/me?tab=following").then((r) => r.json()),
      fetch(`/api/collections/${collectionId}/collaborators`).then((r) => r.json()),
    ])
      .then(([friendsData, collabData]) => {
        setFriends(friendsData);
        setCollaborators(collabData);
      })
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [open, collectionId]);

  const collabMap = new Map(collaborators.map((c) => [c.userId, c]));

  const filtered = friends.filter(
    (f) =>
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    try {
      const res = await fetch(`/api/collections/${collectionId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const collab = await res.json();
        setCollaborators((prev) => [...prev, collab]);
        toast.success("Invitation envoyée");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Erreur lors de l'invitation");
      }
    } catch {
      toast.error("Erreur lors de l'invitation");
    }
    setInviting(null);
  };

  const handleRemove = async (collaboratorId: string) => {
    const res = await fetch(
      `/api/collections/${collectionId}/collaborators/${collaboratorId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
      toast.success("Collaborateur retiré");
    } else {
      toast.error("Erreur");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Inviter des collaborateurs</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Rechercher parmi vos amis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl"
        />

        <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {friends.length === 0
                ? "Suivez des utilisateurs pour les inviter"
                : "Aucun résultat"}
            </p>
          ) : (
            filtered.map((friend) => {
              const collab = collabMap.get(friend.id);
              return (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {friend.image ? (
                      <AvatarImage src={friend.image} alt={friend.name || ""} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {friend.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">
                    {friend.name || "Anonyme"}
                  </span>

                  {collab ? (
                    collab.status === "PENDING" ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] rounded-lg">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-xl text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(collab.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : collab.status === "ACCEPTED" ? (
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] rounded-lg bg-green-500/10 text-green-600 border-green-500/20">
                          <Check className="h-3 w-3 mr-1" />
                          Accepté
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-xl text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(collab.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] rounded-lg">
                        Décliné
                      </Badge>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-xl"
                      onClick={() => handleInvite(friend.id)}
                      disabled={inviting === friend.id}
                    >
                      {inviting === friend.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Inviter
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
