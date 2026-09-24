import type { Habit } from '../types/hierarchical';
import { parseLocalDateKey, shiftLocalDateKey, toLocalDateKey } from './date';

function isScheduled(habit: Habit, dateKey: string): boolean {
  if (habit.frequency === 'daily') return true;
  const weekday = parseLocalDateKey(dateKey).getDay();
  if (habit.frequency === 'weekdays') return weekday >= 1 && weekday <= 5;
  return (habit.custom_days ?? []).includes(weekday);
}

export function calculateHabitStreak(habit: Habit, completedDates: string[], now: Date = new Date()): { current: number; longest: number } {
  const completed = new Set(completedDates);
  const sorted = [...completed].sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of sorted) {
    if (!isScheduled(habit, date)) continue;
    if (!previous) {
      run = 1;
    } else {
      let cursor = shiftLocalDateKey(previous, 1);
      while (!isScheduled(habit, cursor) && cursor < date) cursor = shiftLocalDateKey(cursor, 1);
      run = cursor === date ? run + 1 : 1;
    }
    previous = date;
    longest = Math.max(longest, run);
  }

  let cursor = toLocalDateKey(now);
  if (isScheduled(habit, cursor) && !completed.has(cursor)) cursor = shiftLocalDateKey(cursor, -1);
  while (!isScheduled(habit, cursor)) cursor = shiftLocalDateKey(cursor, -1);

  let current = 0;
  for (let guard = 0; guard < 3660 && completed.has(cursor); guard += 1) {
    current += 1;
    cursor = shiftLocalDateKey(cursor, -1);
    while (!isScheduled(habit, cursor)) cursor = shiftLocalDateKey(cursor, -1);
  }
  return { current, longest: Math.max(longest, current) };
}
