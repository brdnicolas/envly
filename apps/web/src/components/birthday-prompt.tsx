"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/**
 * One-time "when is your birthday?" dialog (day + month), skippable.
 * The server records that it was asked as soon as it shows, so it never comes back.
 */
export function BirthdayPrompt() {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!alive || !p?.askBirthday) return;
        setOpen(true);
        void fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthdayAsked: true }),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const maxDay = month ? new Date(2024, +month, 0).getDate() : 31;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!day || !month) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthday: { day: +day, month: +month } }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Anniversaire enregistré 🎂");
      setOpen(false);
    } else toast.error("Date invalide");
  }

  const select = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quand est votre anniversaire ? 🎂</DialogTitle>
          <DialogDescription>
            Vos amis recevront un rappel deux semaines avant pour découvrir vos envies. Seuls le jour et le mois sont demandés, et
            c&apos;est facultatif.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bd-day">Jour</Label>
              <select id="bd-day" value={day} onChange={(e) => setDay(e.target.value)} className={select} required>
                <option value="">—</option>
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-month">Mois</Label>
              <select id="bd-month" value={month} onChange={(e) => setMonth(e.target.value)} className={select} required>
                <option value="">—</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button type="submit" className="rounded-xl sm:flex-1" disabled={saving || !day || !month}>
              Enregistrer
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl sm:flex-1" onClick={() => setOpen(false)}>
              Je préfère ne pas le dire
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
