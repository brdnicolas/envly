"use client";

import { Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Contribution = { id: string; name: string; amount: number };

const KEY = "contributionTokens";

function tokens(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function setToken(id: string, token: string | null) {
  const t = tokens();
  if (token) t[id] = token;
  else delete t[id];
  localStorage.setItem(KEY, JSON.stringify(t));
}

const euros = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);

/**
 * Group gift on a friend's wish: progress, participants, join / withdraw.
 * `contributions` empty → only the "À plusieurs" button (next to "Réserver").
 */
export function GroupGift({
  wish,
  contributions,
  onChange,
}: {
  wish: { id: string; title: string; price: number | null };
  contributions: Contribution[];
  onChange: (next: Contribution[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const total = contributions.reduce((n, c) => n + c.amount, 0);
  const mine = contributions.find((c) => tokens()[c.id]);
  const remaining = wish.price ? Math.max(0, wish.price - total) : null;
  const pct = wish.price ? Math.min(100, Math.round((total / wish.price) * 100)) : null;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/wishes/${wish.id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount: parseFloat(amount.replace(",", ".")) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      setToken(data.id, data.token);
      onChange(data.contributions);
      setOpen(false);
      toast.success("Participation enregistrée 🎁 Le propriétaire ne le saura pas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!mine || !confirm("Retirer votre participation ?")) return;
    setBusy(true);
    const res = await fetch(`/api/wishes/${wish.id}/contributions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contributionId: mine.id, token: tokens()[mine.id] }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setToken(mine.id, null);
      onChange(data.contributions);
      toast.success("Participation retirée");
    } else toast.error(data.error || "Une erreur est survenue");
    setBusy(false);
  }

  return (
    <>
      {contributions.length > 0 ? (
        <div className="mt-2 space-y-1.5 rounded-xl bg-muted/40 p-2">
          <p className="flex items-center gap-1 text-[11px] font-medium">
            <Users className="h-3 w-3" /> À plusieurs · {euros(total)}
            {wish.price ? <span className="text-muted-foreground"> / {euros(wish.price)}</span> : null}
          </p>
          {pct !== null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#E8C872] transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {contributions.map((c) => `${c.name} (${euros(c.amount)})`).join(", ")}
          </p>
          {mine ? (
            <Button variant="outline" size="sm" className="h-7 w-full rounded-xl text-[11px]" disabled={busy} onClick={withdraw}>
              Retirer ma participation
            </Button>
          ) : (
            <Button size="sm" className="h-7 w-full rounded-xl text-[11px]" onClick={() => setOpen(true)}>
              {remaining === 0 ? "Participer aussi" : "Participer"}
            </Button>
          )}
        </div>
      ) : (
        <Button variant="outline" size="sm" className="mt-1.5 h-7 w-full rounded-xl text-[11px]" onClick={() => setOpen(true)}>
          <Users className="h-3 w-3" /> Offrir à plusieurs
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offrir « {wish.title} » à plusieurs</DialogTitle>
            <DialogDescription>
              Indiquez combien vous mettez. Les autres participants voient votre nom pour s&apos;organiser ; le propriétaire de la liste ne voit rien.
              {remaining ? ` Il manque ${euros(remaining)}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={join} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gg-name">Votre nom</Label>
              <Input id="gg-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gg-amount">Montant (€)</Label>
              <Input
                id="gg-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={remaining ? String(Math.ceil(remaining)) : "20"}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={busy}>
              Je participe
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
