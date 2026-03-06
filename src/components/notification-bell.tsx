"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  data: {
    collectionId?: string;
    collectionName?: string;
    invitedBy?: string;
    invitedByName?: string;
    collaboratorId?: string;
    followerId?: string;
    followerName?: string;
  };
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRespond = async (notification: Notification, accept: boolean) => {
    const { collectionId, collaboratorId } = notification.data;
    if (!collectionId || !collaboratorId) return;

    const res = await fetch(
      `/api/collections/${collectionId}/collaborators/${collaboratorId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: accept ? "ACCEPTED" : "DECLINED" }),
      }
    );

    if (res.ok) {
      toast.success(accept ? "Invitation acceptée" : "Invitation déclinée");
      // Mark as read
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notification.id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } else {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <h3 className="text-sm font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Aucune notification
              </p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRespond={handleRespond}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onRespond,
}: {
  notification: Notification;
  onRespond: (notification: Notification, accept: boolean) => void;
}) {
  const timestamp = (
    <p className="text-[10px] text-muted-foreground mt-1">
      {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  );

  if (notification.type === "COLLABORATION_INVITE") {
    const { invitedByName, collectionName } = notification.data;

    return (
      <div
        className={`px-4 py-3 border-b border-border/40 last:border-0 ${!notification.read ? "bg-accent/30" : ""}`}
      >
        <p className="text-sm">
          <span className="font-medium">{invitedByName}</span> vous invite à collaborer sur{" "}
          <span className="font-medium">{collectionName}</span>
        </p>
        {!notification.read && (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              className="h-7 text-xs rounded-xl"
              onClick={() => onRespond(notification, true)}
            >
              <Check className="h-3 w-3 mr-1" />
              Accepter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs rounded-xl"
              onClick={() => onRespond(notification, false)}
            >
              <X className="h-3 w-3 mr-1" />
              Décliner
            </Button>
          </div>
        )}
        {timestamp}
      </div>
    );
  }

  if (notification.type === "NEW_FOLLOWER") {
    const { followerName } = notification.data;

    return (
      <div
        className={`px-4 py-3 border-b border-border/40 last:border-0 ${!notification.read ? "bg-accent/30" : ""}`}
      >
        <p className="text-sm">
          <span className="font-medium">{followerName}</span> a commencé à vous suivre
        </p>
        {timestamp}
      </div>
    );
  }

  return null;
}
