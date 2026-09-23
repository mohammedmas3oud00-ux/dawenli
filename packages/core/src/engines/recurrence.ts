/**
 * Minimal RFC 5545 RRULE support for recurring tasks.
 *
 * Supported: FREQ (DAILY | WEEKLY | MONTHLY | YEARLY), INTERVAL, BYDAY (weekly only),
 * COUNT and UNTIL. This covers the realistic personal-productivity cases
 * ("every day", "every Mon/Wed/Fri", "every 2 weeks", "monthly on the same day")
 * without pulling in a full RRULE library.
 */
import { addDays, dayOfWeek, parseIsoDate, toIsoDate } from "./dates";

export const RRULE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type RRuleFrequency = (typeof RRULE_FREQUENCIES)[number];

export interface RecurrenceRule {
  freq: RRuleFrequency;
  interval: number;
  /** 0 = Sunday … 6 = Saturday. Only meaningful for WEEKLY. */
  byDay?: number[];
  count?: number;
  /** ISO date (inclusive). */
  until?: string;
}

const BYDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

/** Parses `FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE` (with or without an `RRULE:` prefix). */
export function parseRRule(rule: string): RecurrenceRule | null {
  const body = rule.trim().replace(/^RRULE:/i, "");
  if (!body) return null;

  let freq: RRuleFrequency | undefined;
  let interval = 1;
  let byDay: number[] | undefined;
  let count: number | undefined;
  let until: string | undefined;

  for (const part of body.split(";")) {
    const [rawKey, rawValue] = part.split("=");
    if (!rawKey || rawValue === undefined) return null;
    const key = rawKey.trim().toUpperCase();
    const value = rawValue.trim().toUpperCase();

    switch (key) {
      case "FREQ":
        if (!(RRULE_FREQUENCIES as readonly string[]).includes(value)) return null;
        freq = value as RRuleFrequency;
        break;
      case "INTERVAL": {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 365) return null;
        interval = n;
        break;
      }
      case "BYDAY": {
        const days = value.split(",").map((code) => BYDAY_CODES.indexOf(code as never));
        if (days.some((d) => d < 0)) return null;
        byDay = [...new Set(days)].sort((a, b) => a - b);
        break;
      }
      case "COUNT": {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1) return null;
        count = n;
        break;
      }
      case "UNTIL": {
        const m = /^(\d{4})(\d{2})(\d{2})/.exec(value);
        if (!m) return null;
        until = `${m[1]}-${m[2]}-${m[3]}`;
        try {
          parseIsoDate(until);
        } catch {
          return null;
        }
        break;
      }
      default:
        // Unknown parts (e.g. WKST) are ignored rather than rejected.
        break;
    }
  }

  if (!freq) return null;
  return { freq, interval, ...(byDay ? { byDay } : {}), ...(count ? { count } : {}), ...(until ? { until } : {}) };
}

export function formatRRule(rule: RecurrenceRule): string {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.byDay && rule.byDay.length > 0) {
    parts.push(`BYDAY=${rule.byDay.map((d) => BYDAY_CODES[d]).join(",")}`);
  }
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  if (rule.until) parts.push(`UNTIL=${rule.until.replace(/-/g, "")}`);
  return parts.join(";");
}

function addMonthsClamped(iso: string, months: number): string {
  const date = parseIsoDate(iso);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return toIsoDate(target);
}

/**
 * Next occurrence strictly after `after`, or null when the rule is exhausted
 * (`UNTIL` passed, or `COUNT` reached given `occurrencesSoFar`).
 */
export function nextOccurrence(
  rule: RecurrenceRule,
  after: string,
  occurrencesSoFar = 1,
): string | null {
  if (rule.count !== undefined && occurrencesSoFar >= rule.count) return null;

  let next: string;
  switch (rule.freq) {
    case "DAILY":
      next = addDays(after, rule.interval);
      break;
    case "WEEKLY": {
      if (rule.byDay && rule.byDay.length > 0) {
        next = nextWeeklyByDay(rule, after);
      } else {
        next = addDays(after, 7 * rule.interval);
      }
      break;
    }
    case "MONTHLY":
      next = addMonthsClamped(after, rule.interval);
      break;
    case "YEARLY":
      next = addMonthsClamped(after, 12 * rule.interval);
      break;
  }

  if (rule.until && next > rule.until) return null;
  return next;
}

function nextWeeklyByDay(rule: RecurrenceRule, after: string): string {
  const days = rule.byDay!;
  const dow = dayOfWeek(after);
  // Later in the same week?
  const later = days.find((d) => d > dow);
  if (later !== undefined) return addDays(after, later - dow);
  // Otherwise the first scheduled day, `interval` weeks ahead.
  const first = days[0]!;
  const toWeekStart = -dow; // back to Sunday of the current week
  return addDays(after, toWeekStart + 7 * rule.interval + first);
}

/** Convenience: parse + next in one call; invalid rules yield null. */
export function nextOccurrenceFromRule(
  rule: string | null | undefined,
  after: string,
  occurrencesSoFar = 1,
): string | null {
  if (!rule) return null;
  const parsed = parseRRule(rule);
  if (!parsed) return null;
  return nextOccurrence(parsed, after, occurrencesSoFar);
}
