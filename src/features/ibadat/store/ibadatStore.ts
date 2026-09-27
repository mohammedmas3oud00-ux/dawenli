import { create } from 'zustand';
import type { WorshipDefinition, WorshipLog } from '../../../types/hierarchical';

type CollectionSetter<T> = T[] | ((current: T[]) => T[]);

interface IbadatStoreState {
  worshipDefinitions: WorshipDefinition[];
  worshipLogs: WorshipLog[];
  setWorshipDefinitions(value: CollectionSetter<WorshipDefinition>): void;
  setWorshipLogs(value: CollectionSetter<WorshipLog>): void;
}

export const useIbadatStore = create<IbadatStoreState>((set) => ({
  worshipDefinitions: [],
  worshipLogs: [],
  setWorshipDefinitions: (value) => set((state) => ({ worshipDefinitions: typeof value === 'function' ? value(state.worshipDefinitions) : value })),
  setWorshipLogs: (value) => set((state) => ({ worshipLogs: typeof value === 'function' ? value(state.worshipLogs) : value })),
}));
