/**
 * Natural-language-ish quick-add parser for tasks.
 *
 *   "Write thesis intro #Thesis !p1 @tomorrow ~45m ^high"
 *
 *   #name        → project name (matched case-insensitively by the caller)
 *   !p1 … !p5    → importance (p1 = 5 … p5 = 1, i.e. "P1" is the most important)
 *   @today | @tomorrow | @YYYY-MM-DD | @mon … @sun → scheduled date
 *   ~30m | ~2h | ~1h30m → estimate in minutes
 *   ^low | ^medium | ^high → energy level
 *
 * Everything else is the title. Tokens are only recognised when they stand
 * alone (surrounded by whitespace), so "#1 priority" inside a title is untouched
 * unless the user writes "#1" as a project name — in which case it is one.
 */
import type { EnergyLevel } from "../constants";
import { addDays, dayOfWeek, parseIsoDate } from "./dates";

export interface QuickAddResult {
  title: string;
  projectName?: string;
  importance?: number;
  scheduledDate?: string;
  estimateMinutes?: number;
  energy?: EnergyLevel;
}

const WEEKDAYS: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const ENERGY: Record<string, EnergyLevel> = { low: "low", medium: "medium", high: "high" };

/** `@fri` → the next Friday strictly after today (or today if it is Friday). */
export function resolveDateToken(token: string, today: string): string | null {
  const lower = token.toLowerCase();
  if (lower === "today") return today;
  if (lower === "tomorrow") return addDays(today, 1);
  if (lower in WEEKDAYS) {
    const target = WEEKDAYS[lower]!;
    const diff = (target - dayOfWeek(today) + 7) % 7;
    return addDays(today, diff);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    try {
      parseIsoDate(lower);
      return lower;
    } catch {
      return null;
    }
  }
  return null;
}

/** `45m`, `2h`, `1h30m`, `90` (minutes) → minutes; null when unparseable or zero. */
export function parseDuration(token: string): number | null {
  const lower = token.toLowerCase();
  if (/^\d+$/.test(lower)) return Number(lower) > 0 ? Number(lower) : null;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?$/.exec(lower);
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  const minutes = Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
  return minutes > 0 ? minutes : null;
}

export function parseQuickAdd(input: string, today: string): QuickAddResult {
  const result: QuickAddResult = { title: "" };
  const titleParts: string[] = [];

  for (const token of input.trim().split(/\s+/)) {
    if (token.length < 2) {
      if (token) titleParts.push(token);
      continue;
    }
    const sigil = token[0];
    const body = token.slice(1);

    if (sigil === "#" && result.projectName === undefined) {
      result.projectName = body;
      continue;
    }
    if (sigil === "!" && /^p[1-5]$/i.test(body) && result.importance === undefined) {
      result.importance = 6 - Number(body[1]);
      continue;
    }
    if (sigil === "@" && result.scheduledDate === undefined) {
      const date = resolveDateToken(body, today);
      if (date) {
        result.scheduledDate = date;
        continue;
      }
    }
    if (sigil === "~" && result.estimateMinutes === undefined) {
      const minutes = parseDuration(body);
      if (minutes) {
        result.estimateMinutes = minutes;
        continue;
      }
    }
    if (sigil === "^" && result.energy === undefined) {
      const energy = ENERGY[body.toLowerCase()];
      if (energy) {
        result.energy = energy;
        continue;
      }
    }
    titleParts.push(token);
  }

  result.title = titleParts.join(" ").trim();
  return result;
}
