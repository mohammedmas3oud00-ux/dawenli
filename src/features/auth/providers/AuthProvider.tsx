import React, { createContext, useCallback, useEffect, useMemo } from 'react';
import { isSupabaseConfigured, supabase } from '../../../shared/services/supabaseClient';
import { createAuthService } from '../services/authService';
import type { AuthState } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type AppUser = Exclude<AuthState, { status: 'loading' | 'signedOut' }>['user'];

export interface AuthContextValue {
  status: AuthState['status'];
  user: AppUser | null;
  adoptUser(user: { id?: string; email: string; isGuest?: boolean }): void;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const state = useAuthStore((store) => store.state);
  const setState = useAuthStore((store) => store.setAuthState);
  const service = useMemo(() => createAuthService(isSupabaseConfigured ? supabase : null), []);

  useEffect(() => {
    let active = true;
    void service.getSessionUser().then((user) => {
      if (active) setState(user ? { status: 'authenticated', user } : { status: 'signedOut', user: null });
    }).catch(() => {
      if (active) setState({ status: 'signedOut', user: null });
    });
    const unsubscribe = service.onAuthStateChange((user) => {
      if (!active) return;
      setState(user ? { status: 'authenticated', user } : { status: 'signedOut', user: null });
    });
    return () => { active = false; unsubscribe(); };
  }, [service, setState]);

  const adoptUser = useCallback((user: { id?: string; email: string; isGuest?: boolean }) => {
    setState(user.isGuest
      ? { status: 'guest', user: { id: user.id, email: user.email, isGuest: true } }
      : { status: 'authenticated', user: { id: user.id || '', email: user.email, isGuest: false } });
  }, [setState]);

  const signOut = useCallback(async () => {
    await service.signOut();
    setState({ status: 'signedOut', user: null });
  }, [service, setState]);

  const value = useMemo<AuthContextValue>(() => ({ status: state.status, user: state.user, adoptUser, signOut }), [state, adoptUser, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
