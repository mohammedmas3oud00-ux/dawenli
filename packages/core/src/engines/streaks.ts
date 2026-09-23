import type { HabitFrequency } from "../constants";
import { addDays, dayOfWeek, daysBetween, monthKey, startOfWeek } from "./dates";

export interface HabitLogForStreak {
  logDate: string;
  completed: boolean;
}

export interface StreakHabit {
  frequency: HabitFrequency;
  /** For daily habits: restrict to these weekdays (0 = Sunday … 6 = Saturday). */
  daysOfWeek?: readonly number[] | null;
  /** Completions required per period (weekly / monthly). */
  targetCount?: number | null;
}

export interface StreakContext {
  today: string;
  weekStartsOn: number;
}

export interface StreakResult {
  current: number;
  longest: number;
}

/** Period key: the date itself (daily), first day of week (weekly), "YYYY-MM" (monthly). */
export function periodKey(iso: string, habit: StreakHabit, ctx: StreakContext): string {
  switch (habit.frequency) {
    case "daily":
      return iso;
    case "weekly":
      return startOfWeek(iso, ctx.weekStartsOn);
    case "monthly":
      return monthKey(iso);
  }
}

function isScheduledDay(iso: string, habit: StreakHabit): boolean {
  if (habit.frequency !== "daily") return true;
  if (!habit.daysOfWeek || habit.daysOfWeek.length === 0) return true;
  return habit.daysOfWeek.includes(dayOfWeek(iso));
}

function previousPeriod(key: string, habit: StreakHabit): string {
  switch (habit.frequency) {
    case "daily":
      return addDays(key, -1);
    case "weekly":
      return addDays(key, -7);
    case "monthly": {
      const [y, m] = key.split("-").map(Number) as [number, number];
      const date = new Date(Date.UTC(y, m - 2, 1));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }
  }
}

/** Number of completions per period, only counting completed logs. */
function completionsByPeriod(
  logs: readonly HabitLogForStreak[],
  habit: StreakHabit,
  ctx: StreakContext,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const log of logs) {
    if (!log.completed) continue;
    const key = periodKey(log.logDate, habit, ctx);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function periodMet(count: number | undefined, habit: StreakHabit): boolean {
  const target = habit.frequency === "daily" ? 1 : Math.max(1, habit.targetCount ?? 1);
  return (count ?? 0) >= target;
}

/**
 * Computes the current and longest streak.
 *
 * - The current streak counts consecutive satisfied periods ending at today
 *   *or* at the previous period (today is still open and must not break the streak).
 * - For daily habits restricted to specific weekdays, non-scheduled days are skipped
 *   rather than counted as misses.
 */
export function computeStreak(
  logs: readonly HabitLogForStreak[],
  habit: StreakHabit,
  ctx: StreakContext,
): StreakResult {
  const byPeriod = completionsByPeriod(logs, habit, ctx);
  if (byPeriod.size === 0) return { current: 0, longest: 0 };

  // --- current streak: walk backwards from today
  let current = 0;
  let cursor = periodKey(ctx.today, habit, ctx);
  const todayMet = periodMet(byPeriod.get(cursor), habit);
  if (!todayMet) {
    // Today is still in progress — start counting from the previous period.
    cursor = previousPeriod(cursor, habit);
  }
  // Guard against pathological loops on huge gaps: bound by earliest log.
  const earliest = [...byPeriod.keys()].sort()[0]!;
  while (cursor >= earliest) {
    if (habit.frequency === "daily" && !isScheduledDay(cursor, habit)) {
      cursor = previousPeriod(cursor, habit);
      continue;
    }
    if (!periodMet(byPeriod.get(cursor), habit)) break;
    current += 1;
    cursor = previousPeriod(cursor, habit);
  }

  // --- longest streak: scan all satisfied periods chronologically
  const satisfied = [...byPeriod.entries()]
    .filter(([, count]) => periodMet(count, habit))
    .map(([key]) => key)
    .sort();

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of satisfied) {
    if (prev === null) {
      run = 1;
    } else if (isConsecutive(prev, key, habit)) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = key;
  }

  return { current: Math.max(current, 0), longest: Math.max(longest, current) };
}

function isConsecutive(prevKey: string, key: string, habit: StreakHabit): boolean {
  if (habit.frequency === "monthly") return previousPeriod(key, habit) === prevKey;
  if (habit.frequency === "weekly") return daysBetween(prevKey, key) === 7;
  // daily: consecutive if no *scheduled* day lies strictly between them
  let cursor = addDays(prevKey, 1);
  while (cursor < key) {
    if (isScheduledDay(cursor, habit)) return false;
    cursor = addDays(cursor, 1);
  }
  return true;
}

/**
 * Completion rate over the last `days` days (inclusive of today):
 * satisfied scheduled periods / total scheduled periods, as 0..100.
 */
export function completionRate(
  logs: readonly HabitLogForStreak[],
  habit: StreakHabit,
  ctx: StreakContext,
  days: number,
): number {
  if (days <= 0) return 0;
  const byPeriod = completionsByPeriod(logs, habit, ctx);
  const from = addDays(ctx.today, -(days - 1));

  const periods = new Set<string>();
  for (let d = from; d <= ctx.today; d = addDays(d, 1)) {
    if (isScheduledDay(d, habit)) periods.add(periodKey(d, habit, ctx));
  }
  if (periods.size === 0) return 0;

  let met = 0;
  for (const key of periods) if (periodMet(byPeriod.get(key), habit)) met += 1;
  return Math.round((100 * met) / periods.size);
}
