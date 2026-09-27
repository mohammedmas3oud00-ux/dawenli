import { create } from 'zustand';
import type { Task } from '../../../types/hierarchical';

type CollectionSetter<T> = T[] | ((current: T[]) => T[]);

export interface TaskStoreState {
  tasks: Task[];
  setTasks(value: CollectionSetter<Task>): void;
}

export const useTaskStore = create<TaskStoreState>((set) => ({
  tasks: [],
  setTasks: (value) => set((state) => ({ tasks: typeof value === 'function' ? value(state.tasks) : value })),
}));
