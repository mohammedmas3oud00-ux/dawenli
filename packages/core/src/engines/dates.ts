/**
 * Minimal, dependency-free calendar-date helpers.
 * All functions operate on ISO calendar dates ("YYYY-MM-DD") interpreted in UTC
 * so results never depend on the host machine's timezone. Callers are
 * responsible for converting a user's local "today" (using `profiles.timezone`)
 * into an ISO date before calling the engines.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) throw new RangeError(`Invalid ISO date: ${value}`);
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    throw new RangeError(`Invalid ISO date: ${value}`);
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Whole days from `from` to `to` (negative when `to` is before `from`). */
export function daysBetween(from: string, to: string): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(iso: string): number {
  return parseIsoDate(iso).getUTCDay();
}

/** First day of the week containing `iso`, given the configured week start. */
export function startOfWeek(iso: string, weekStartsOn: number): string {
  const dow = dayOfWeek(iso);
  const diff = (dow - weekStartsOn + 7) % 7;
  return addDays(iso, -diff);
}

/** "YYYY-MM" month key. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function startOfMonth(iso: string): string {
  return `${monthKey(iso)}-01`;
}

/**
 * Formats a JS Date as the ISO calendar date in the given IANA timezone.
 * This is the single bridge between wall-clock time and the date-only engines.
 */
export function todayInTimezone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
