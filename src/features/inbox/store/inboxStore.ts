import { create } from 'zustand';
import type { InboxItem } from '../../../types/hierarchical';

type CollectionSetter<T> = T[] | ((current: T[]) => T[]);

interface InboxStoreState {
  inboxItems: InboxItem[];
  setInboxItems(value: CollectionSetter<InboxItem>): void;
}

export const useInboxStore = create<InboxStoreState>((set) => ({
  inboxItems: [],
  setInboxItems: (value) =>
    set((state) => ({ inboxItems: typeof value === 'function' ? value(state.inboxItems) : value })),
}));
