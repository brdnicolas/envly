"use client";

import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Person = { id: string; name: string | null };
type Message = { id: string; body: string; createdAt: string; mine: boolean };
type Threads = { recipient: Message[]; santa: Message[] };

/** Organizer: pairs of people who must not draw each other (couples, siblings…). */
export function SantaExclusions({
  people,
  exclusions,
  busy,
  onChange,
}: {
  people: Person[];
  exclusions: [string, string][];
  busy: boolean;
  onChange: (next: [string, string][]) => void;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "Participant";
  const add = () => {
    if (!a || !b || a === b) return;
    onChange([...exclusions, [a, b]]);
    setA("");
    setB("");
  };
  const select = (value: string, set: (v: string) => void, label: string) => (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => set(e.target.value)}
      className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
    >
      <option value="">— Choisir —</option>
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name ?? "Participant"}
        </option>
      ))}
    </select>
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Exclusions</h2>
        <p className="text-xs text-muted-foreground">Ces personnes ne pourront pas se tirer au sort entre elles (couples, frères et sœurs…).</p>
      </div>
      {exclusions.length > 0 && (
        <ul className="space-y-2">
          {exclusions.map(([x, y]) => (
            <li key={`${x}-${y}`} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2 text-sm">
              <span>
                {name(x)} <span className="text-muted-foreground">↮</span> {name(y)}
              </span>
              <button
                type="button"
                aria-label="Supprimer l'exclusion"
                disabled={busy}
                onClick={() => onChange(exclusions.filter(([p, q]) => !(p === x && q === y)))}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        {select(a, setA, "Première personne")}
        <span className="text-muted-foreground">↮</span>
        {select(b, setB, "Deuxième personne")}
        <Button variant="outline" onClick={add} disabled={busy || !a || !b || a === b} className="rounded-xl">
          Ajouter
        </Button>
      </div>
    </section>
  );
}

/** Anonymous questions: to the person I give to, and from my own Secret Santa. */
export function SantaChat({ santaId, recipientName }: { santaId: string; recipientName: string | null }) {
  const [threads, setThreads] = useState<Threads | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/santas/${santaId}/messages`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setThreads(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [santaId]);

  async function send(thread: keyof Threads, body: string) {
    const res = await fetch(`/api/santas/${santaId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread, body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
    setThreads((t) => (t ? { ...t, [thread]: [...t[thread], data] } : t));
  }

  if (!threads) return null;
  return (
    <div className="space-y-6">
      <Thread
        title={`Question anonyme à ${recipientName ?? "la personne à qui vous offrez"}`}
        hint="Elle ne saura pas que c'est vous. Taille, couleur préférée, déjà lu ce livre ?"
        messages={threads.recipient}
        theirLabel={recipientName ?? "Réponse"}
        onSend={(b) => send("recipient", b)}
      />
      <Thread
        title="Votre Secret Santa"
        hint="Les questions de la personne qui vous offre un cadeau. Vous ne saurez pas qui c'est."
        messages={threads.santa}
        theirLabel="Secret Santa"
        onSend={(b) => send("santa", b)}
        replyOnly
      />
    </div>
  );
}

function Thread({
  title,
  hint,
  messages,
  theirLabel,
  onSend,
  replyOnly,
}: {
  title: string;
  hint: string;
  messages: Message[];
  theirLabel: string;
  onSend: (body: string) => Promise<void>;
  replyOnly?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: "nearest" }), [messages.length]);

  // My own Santa's thread only exists once they wrote first.
  if (replyOnly && messages.length === 0) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSend(text);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {messages.length > 0 && (
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "bg-[#E8C872] text-black" : "bg-muted"}`}
              >
                {!m.mine && <p className="text-[11px] font-medium text-muted-foreground">{theirLabel}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder={replyOnly ? "Répondre…" : "Poser une question…"}
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()} className="h-10 w-10 rounded-xl" aria-label="Envoyer">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}
