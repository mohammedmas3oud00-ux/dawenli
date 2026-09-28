import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { AuthProvider } from './AuthProvider';

const { service } = vi.hoisted(() => ({
  service: {
    getSessionUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('../services/authService', () => ({
  createAuthService: vi.fn(() => service),
}));
vi.mock('../../../shared/services/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: null }));

function Consumer() {
  const auth = useAuth();
  return (
    <output data-testid="auth-state">
      {auth.status}:{auth.user?.email || 'none'}
    </output>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    cleanup();
    service.getSessionUser.mockReset().mockResolvedValue(null);
    service.onAuthStateChange.mockReset().mockReturnValue(() => undefined);
    service.signOut.mockReset().mockResolvedValue(undefined);
    useAuthStore.getState().setAuthState({ status: 'loading', user: null });
  });

  it('initializes signed-out state when there is no session', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signedOut:none'));
    expect(service.getSessionUser).toHaveBeenCalledOnce();
  });

  it('normalizes auth state changes into the shared context', async () => {
    let callback: ((user: { id: string; email: string } | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((next: typeof callback) => {
      callback = next;
      return () => undefined;
    });
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signedOut:none'));
    callback?.({ id: 'user-1', email: 'user@example.com' });
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated:user@example.com'));
  });
});
