"use client";

import { Download, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Summary = { name: string; count: number }[];

/** Settings → "Mes données": download my lists, import lists from a file (Envly or another app). */
export function DataTransfer() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(f: File, dry: boolean) {
    const form = new FormData();
    form.append("file", f);
    if (dry) form.append("preview", "1");
    const res = await fetch("/api/account/import", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Import impossible");
    return data as { lists: Summary; wishes?: number };
  }

  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setPreview(null);
    try {
      setPreview((await send(f, true)).lists);
      setFile(f);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible");
      setFile(null);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function confirmImport() {
    if (!file) return;
    setBusy(true);
    try {
      const res = await send(file, false);
      toast.success(`${res.wishes} envie${(res.wishes ?? 0) > 1 ? "s" : ""} importée${(res.wishes ?? 0) > 1 ? "s" : ""} dans ${res.lists.length} liste${res.lists.length > 1 ? "s" : ""} privée${res.lists.length > 1 ? "s" : ""}`);
      setFile(null);
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setBusy(false);
    }
  }

  const total = preview?.reduce((n, l) => n + l.count, 0) ?? 0;

  return (
    <section id="donnees" className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Exporter mes listes</h2>
        <p className="text-sm text-muted-foreground">
          Téléchargez toutes vos listes et vos envies. Les réservations de vos proches ne sont jamais incluses.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <a href="/api/account/export?format=json" download>
              <Download className="h-4 w-4" /> JSON (réimportable)
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <a href="/api/account/export?format=csv" download>
              <Download className="h-4 w-4" /> CSV (Excel)
            </a>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Importer des listes</h2>
        <p className="text-sm text-muted-foreground">
          Vous venez d&apos;une autre application ? Exportez vos listes depuis celle-ci (ou demandez-lui vos données), puis
          importez le fichier CSV ou JSON ici. Colonnes reconnues : liste, titre, lien, prix, description. Les listes sont
          créées en privé.
        </p>
        <input ref={input} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Button variant="outline" className="rounded-xl" disabled={busy} onClick={() => input.current?.click()}>
          {busy && !preview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Choisir un fichier
        </Button>

        {preview && (
          <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-sm font-medium">
              {file?.name} : {total} envie{total > 1 ? "s" : ""} dans {preview.length} liste{preview.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {preview.slice(0, 10).map((l) => (
                <li key={l.name}>
                  {l.name} · {l.count}
                </li>
              ))}
              {preview.length > 10 && <li>… et {preview.length - 10} autres</li>}
            </ul>
            <div className="flex gap-2">
              <Button className="rounded-xl" disabled={busy} onClick={confirmImport}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Importer
              </Button>
              <Button variant="ghost" className="rounded-xl" disabled={busy} onClick={() => (setPreview(null), setFile(null))}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
