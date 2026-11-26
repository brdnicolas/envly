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

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** { day: 24, month: 12 } → "24 décembre" */
export function formatBirthday(b: { day: number; month: number }) {
  return `${b.day === 1 ? '1er' : b.day} ${MONTHS[b.month - 1]}`;
}

/** "24/12" or "24/12/1990" → { day, month } (year ignored), null if invalid. */
export function parseBirthdayInput(value: string): { day: number; month: number } | null {
  const m = value.trim().match(/^(\d{1,2})[/.\- ](\d{1,2})/);
  if (!m) return null;
  const day = +m[1];
  const month = +m[2];
  if (month < 1 || month > 12 || day < 1 || day > new Date(2024, month, 0).getDate()) return null;
  return { day, month };
}

/** "24/12/2026" → "2026-12-24", "" → null, undefined if invalid. */
export function parseDateInput(value: string): string | null | undefined {
  const v = value.trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{2,4})$/);
  if (!m) return undefined;
  const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
  const d = new Date(year, +m[2] - 1, +m[1]);
  if (d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return undefined;
  return `${year}-${String(+m[2]).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
}

/** ISO date → "24/12/2026" for editing. */
export function toDateInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Whole days from today to an ISO date (negative when past). */
export function daysUntil(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}

/** "Aujourd'hui", "Demain", "J-12" or null once past. */
export function countdown(iso: string | null | undefined) {
  if (!iso) return null;
  const n = daysUntil(iso);
  if (n < 0) return null;
  if (n === 0) return 'Aujourd’hui';
  if (n === 1) return 'Demain';
  return `J-${n}`;
}
