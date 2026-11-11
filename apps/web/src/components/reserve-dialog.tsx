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

function saveReservationToken(wishId: string, token: string) {
  const tokens = JSON.parse(localStorage.getItem("reservationTokens") || "{}");
  tokens[wishId] = token;
  localStorage.setItem("reservationTokens", JSON.stringify(tokens));
}

export function getReservationToken(wishId: string): string | null {
  if (typeof window === "undefined") return null;
  const tokens = JSON.parse(localStorage.getItem("reservationTokens") || "{}");
  return tokens[wishId] || null;
}

function removeReservationToken(wishId: string) {
  const tokens = JSON.parse(localStorage.getItem("reservationTokens") || "{}");
  delete tokens[wishId];
  localStorage.setItem("reservationTokens", JSON.stringify(tokens));
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
      const data = await res.json();
      saveReservationToken(wish.id, data.token);
      onReserved(wish.id, name);
      onOpenChange(false);
      setName("");
      toast.success("Réservé ! Le propriétaire ne verra pas qui a réservé.");
    } else {
      const data = await res.json();
      toast.error(data.error || "Échec de la réservation");
    }

    setLoading(false);
  };

  return (
    <Dialog open={!!wish} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réserver &laquo; {wish?.title} &raquo;</DialogTitle>
          <DialogDescription>
            Entrez votre nom pour que les autres sachent que cet article est pris. Le propriétaire ne verra pas qui a réservé.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reserveName">Votre nom</Label>
            <Input
              id="reserveName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Réservation..." : "Confirmer la réservation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CancelReservationButton({
  wishId,
  onCancelled,
}: {
  wishId: string;
  onCancelled: (wishId: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    const token = getReservationToken(wishId);
    if (!token) return;

    setLoading(true);
    const res = await fetch("/api/reserve", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishId, token }),
    });

    if (res.ok) {
      removeReservationToken(wishId);
      onCancelled(wishId);
      toast.success("Réservation annulée");
    } else {
      const data = await res.json();
      toast.error(data.error || "Échec de l'annulation");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full h-7 text-[11px] mt-1.5 rounded-xl"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? "Annulation..." : "Annuler la réservation"}
    </Button>
  );
}
