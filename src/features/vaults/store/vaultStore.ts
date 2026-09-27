import { create } from 'zustand';
import type { VaultItem } from '../../../types/hierarchical';

type CollectionSetter<T> = T[] | ((current: T[]) => T[]);

interface VaultStoreState {
  vaults: VaultItem[];
  setVaults(value: CollectionSetter<VaultItem>): void;
}

export const useVaultStore = create<VaultStoreState>((set) => ({
  vaults: [],
  setVaults: (value) => set((state) => ({ vaults: typeof value === 'function' ? value(state.vaults) : value })),
}));
