import { create } from 'zustand';
import type { AuthState } from '../services/authService';

interface AuthStoreState {
  state: AuthState;
  setAuthState(state: AuthState): void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  state: { status: 'loading', user: null },
  setAuthState: (state) => set({ state }),
}));
