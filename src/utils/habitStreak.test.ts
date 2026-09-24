import { describe, expect, it } from 'vitest';
import type { Habit } from '../types/hierarchical';
import { calculateHabitStreak } from './habitStreak';

const habit = (frequency: Habit['frequency'], custom_days?: number[]): Habit => ({
  id: crypto.randomUUID(), pillar_id: crypto.randomUUID(), title: 'test', description: '', frequency,
  custom_days, target_days_per_week: 7, time_of_day: 'morning', current_streak: 0, longest_streak: 0,
  completed_dates: [], is_active: true, created_at: new Date().toISOString(),
});

describe('habit streaks', () => {
  it('skips weekends for weekday habits', () => {
    const result = calculateHabitStreak(habit('weekdays'), ['2026-09-18', '2026-09-21', '2026-09-22'], new Date(2026, 8, 22, 12));
    expect(result.current).toBe(3);
  });

  it('counts only selected custom days', () => {
    const result = calculateHabitStreak(habit('custom_days', [1, 3]), ['2026-09-21', '2026-09-23'], new Date(2026, 8, 23, 12));
    expect(result.current).toBe(2);
  });
});
