import { create } from 'zustand';
import type { JournalEntry } from '../../../types/hierarchical';

interface JournalStoreState {
  journals: JournalEntry[];
  setJournals(value: JournalEntry[] | ((current: JournalEntry[]) => JournalEntry[])): void;
}

export const useJournalStore = create<JournalStoreState>((set) => ({
  journals: [],
  setJournals: (value) => set((state) => ({ journals: typeof value === 'function' ? value(state.journals) : value })),
}));
