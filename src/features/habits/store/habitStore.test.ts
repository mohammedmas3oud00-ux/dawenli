import { describe, expect, it } from 'vitest';
import { useHabitStore } from './habitStore';

describe('habit store', () => {
  it('supports functional collection updates', () => {
    useHabitStore.setState({ habits: [] });
    useHabitStore.getState().setHabits((current) => [...current, { id: 'habit-1' } as never]);
    expect(useHabitStore.getState().habits.map((habit) => habit.id)).toEqual(['habit-1']);
    useHabitStore.setState({ habits: [] });
  });
});
