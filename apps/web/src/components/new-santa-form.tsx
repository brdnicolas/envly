"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Eyebrow } from "@/components/seo-article";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BUDGETS = [10, 15, 20, 30, 50];

export function NewSantaForm() {
  const router = useRouter();
  const [name, setName] = useState(`Secret Santa ${new Date().getFullYear()}`);
  const [budget, setBudget] = useState<number | null>(20);
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/santas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, budget, date: date || null, collectionId: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      toast.success("Secret Santa créé 🎁 Partagez le lien d'invitation !");
      router.push(`/s/${data.inviteCode}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2">
        <Eyebrow>Secret Santa</Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight">Créer un Secret Santa</h1>
        <p className="text-sm text-muted-foreground">Vous pourrez inviter les participants juste après.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="santa-name">Nom</Label>
        <Input id="santa-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
      </div>
      <div className="space-y-1.5">
        <Label>Budget par cadeau</Label>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBudget(budget === b ? null : b)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${budget === b ? "border-[#E8C872] bg-[#E8C872]/10" : "border-border/60 hover:border-foreground/30"}`}
            >
              {b} €
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="santa-date">Date de l&apos;échange (optionnelle)</Label>
        <Input id="santa-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={busy || !name.trim()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer et inviter"}
      </Button>
    </form>
  );
}
