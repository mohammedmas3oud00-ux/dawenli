import { describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

describe('auth store', () => {
  it('keeps the auth state outside presentation components', () => {
    useAuthStore.getState().setAuthState({ status: 'signedOut', user: null });
    expect(useAuthStore.getState().state.status).toBe('signedOut');
    useAuthStore.getState().setAuthState({ status: 'loading', user: null });
  });
});
