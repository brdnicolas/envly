"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Wish {
  id: string;
  title: string;
}

export function ReserveDialog({
  wish,
  onOpenChange,
  onReserved,
}: {
  wish: Wish | null;
  onOpenChange: (open: boolean) => void;
  onReserved: (wishId: string, reservedBy: string) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish) return;
    setLoading(true);

    const res = await fetch("/api/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId: wish.id, reservedBy: name }),
    });

    if (res.ok) {
      onReserved(wish.id, name);
      onOpenChange(false);
      setName("");
      toast.success("Reserved! The owner won't see who reserved it.");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to reserve");
    }

    setLoading(false);
  };

  return (
    <Dialog open={!!wish} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reserve &ldquo;{wish?.title}&rdquo;</DialogTitle>
          <DialogDescription>
            Enter your name so others know this item is taken. The owner will not see who reserved it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reserveName">Your name</Label>
            <Input
              id="reserveName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Reserving..." : "Confirm reservation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
