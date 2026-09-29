import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../providers/AuthProvider';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('AuthProvider');
  });

  it('returns the context value inside the provider', () => {
    const value = {
      session: null,
      user: null,
      loading: false,
      error: null,
      signInWithGoogle: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={value as never}>{children}</AuthContext.Provider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(false);
  });
});
