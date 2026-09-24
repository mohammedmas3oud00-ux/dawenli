import type { ReviewType } from "../constants";
import { addDays, parseIsoDate, startOfMonth, startOfWeek, toIsoDate } from "./dates";

export interface Period {
  start: string;
  end: string;
}

function endOfMonth(iso: string): string {
  const d = parseIsoDate(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return toIsoDate(d);
}

/**
 * The review period that contains `iso` for the given review type.
 * Weekly periods honour the user's configured week start (0 = Sunday … 6 = Saturday).
 */
export function periodFor(type: ReviewType, iso: string, weekStartsOn: number): Period {
  switch (type) {
    case "daily":
      return { start: iso, end: iso };
    case "weekly": {
      const start = startOfWeek(iso, weekStartsOn);
      return { start, end: addDays(start, 6) };
    }
    case "monthly":
      return { start: startOfMonth(iso), end: endOfMonth(iso) };
    case "quarterly": {
      const d = parseIsoDate(iso);
      const quarterStartMonth = Math.floor(d.getUTCMonth() / 3) * 3;
      const start = new Date(Date.UTC(d.getUTCFullYear(), quarterStartMonth, 1));
      const end = new Date(Date.UTC(d.getUTCFullYear(), quarterStartMonth + 3, 0));
      return { start: toIsoDate(start), end: toIsoDate(end) };
    }
    case "yearly": {
      const year = iso.slice(0, 4);
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
  }
}

/** The period immediately before / after `period` for the same review type. */
export function shiftPeriod(
  type: ReviewType,
  period: Period,
  direction: -1 | 1,
  weekStartsOn: number,
): Period {
  const anchor = direction < 0 ? addDays(period.start, -1) : addDays(period.end, 1);
  return periodFor(type, anchor, weekStartsOn);
}

/** True when `iso` lies within the period (inclusive). */
export function inPeriod(iso: string, period: Period): boolean {
  return iso >= period.start && iso <= period.end;
}
