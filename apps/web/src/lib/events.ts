/** Dates of occasions: list event dates and birthdays (day + month only). */

/** "2026-12-24" (or any ISO date) → Date at noon UTC, so it never shifts a day across time zones. null clears. */
export function parseEventDate(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  if (typeof v !== "string") return undefined;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** { day, month } → validated pair, null to clear, undefined when absent or invalid. */
export function parseBirthday(v: unknown): { birthdayDay: number | null; birthdayMonth: number | null } | undefined {
  if (v === undefined) return undefined;
  if (v === null) return { birthdayDay: null, birthdayMonth: null };
  if (typeof v !== "object") return undefined;
  const { day, month } = v as { day?: unknown; month?: unknown };
  if (!Number.isInteger(day) || !Number.isInteger(month)) return undefined;
  const d = day as number;
  const m = month as number;
  if (m < 1 || m > 12 || d < 1) return undefined;
  const max = new Date(Date.UTC(2024, m, 0)).getUTCDate(); // 2024 is a leap year: 29 Feb allowed
  if (d > max) return undefined;
  return { birthdayDay: d, birthdayMonth: m };
}

export function serializeBirthday(u: { birthdayDay: number | null; birthdayMonth: number | null }) {
  return u.birthdayDay && u.birthdayMonth ? { day: u.birthdayDay, month: u.birthdayMonth } : null;
}

/** Today's calendar date in Paris, shifted by `days`, as a UTC-noon Date. */
export function parisDay(days = 0, now = new Date()) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12));
}
