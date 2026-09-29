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

async function renderProvider() {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signedOut:none'));
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
    await renderProvider();
    expect(service.getSessionUser).toHaveBeenCalledOnce();
  });

  it('recovers to signed-out when the session lookup fails', async () => {
    service.getSessionUser.mockRejectedValue(new Error('network'));
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signedOut:none'));
  });

  it('normalizes auth state changes into the shared context', async () => {
    let callback: ((user: { id: string; email: string } | null) => void) | undefined;
    service.onAuthStateChange.mockImplementation((next: typeof callback) => {
      callback = next;
      return () => undefined;
    });
    await renderProvider();
    callback?.({ id: 'user-1', email: 'user@example.com' });
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated:user@example.com'));
  });

  it('signs out and clears the shared auth state', async () => {
    let adopt: ((user: { id?: string; email: string; isGuest?: boolean }) => void) | undefined;
    let signOut: (() => Promise<void>) | undefined;
    function Controls() {
      const auth = useAuth();
      adopt = auth.adoptUser;
      signOut = auth.signOut;
      return null;
    }
    render(
      <AuthProvider>
        <Controls />
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(service.getSessionUser).toHaveBeenCalledOnce());
    adopt?.({ email: 'guest@example.com', isGuest: true });
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('guest:guest@example.com'));
    await signOut?.();
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signedOut:none'));
    expect(service.signOut).toHaveBeenCalledOnce();
  });

  it('adopts an authenticated user with a generated id', async () => {
    let adopt: ((user: { id?: string; email: string; isGuest?: boolean }) => void) | undefined;
    function Controls() {
      const auth = useAuth();
      adopt = auth.adoptUser;
      return null;
    }
    render(
      <AuthProvider>
        <Controls />
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(service.getSessionUser).toHaveBeenCalledOnce());
    adopt?.({ email: 'user@example.com' });
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated:user@example.com'));
  });
});
