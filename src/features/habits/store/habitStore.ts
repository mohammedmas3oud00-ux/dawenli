import { create } from 'zustand';
import type { Habit } from '../../../types/hierarchical';

type CollectionSetter<T> = T[] | ((current: T[]) => T[]);

export interface HabitStoreState {
  habits: Habit[];
  setHabits(value: CollectionSetter<Habit>): void;
}

export const useHabitStore = create<HabitStoreState>((set) => ({
  habits: [],
  setHabits: (value) => set((state) => ({ habits: typeof value === 'function' ? value(state.habits) : value })),
}));
