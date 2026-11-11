/** "🍎 Appart" → { emoji: "🍎", label: "Appart" } */
const EMOJI_PREFIX =
  /^((?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{3030}\u{303D}\u{3297}\u{3299}])(?:[\u{FE0F}\u{200D}\u{20E3}\u{1F3FB}-\u{1F3FF}]|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}])*)\s*/u;

export function splitEmoji(name: string): { emoji: string | null; label: string } {
  const m = name.match(EMOJI_PREFIX);
  if (!m) return { emoji: null, label: name };
  const label = name.slice(m[0].length).trim();
  return label ? { emoji: m[1], label } : { emoji: null, label: name };
}

export function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

export function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? '';
}

export function parsePriceInput(value: string): number | null {
  const v = value.replace(/[\s€]/g, '').replace(',', '.');
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "à l'instant", "il y a 5 min", "il y a 3 h", "hier", "il y a 4 j", then a short date. */
export function timeAgo(iso: string | Date) {
  const t = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86_400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 2 * 86_400) return 'hier';
  if (s < 7 * 86_400) return `il y a ${Math.floor(s / 86_400)} j`;
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
