import { describe, expect, it, vi } from 'vitest';
import { createAuthService, mapAuthUser } from './authService';

describe('auth service boundary', () => {
  it('maps a Supabase user to the app auth shape', () => {
    expect(mapAuthUser({ id: 'user-1', email: 'user@example.com' } as never)).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      isGuest: false,
    });
  });

  it('rejects a user without an email', () => {
    expect(() => mapAuthUser({ id: 'user-1' } as never)).toThrow('لا يحتوي');
  });

  it('rejects cloud operations when Supabase is unavailable', async () => {
    const service = createAuthService(null);
    await expect(service.signInWithPassword('user@example.com', 'secret')).rejects.toThrow('غير مهيأة');
    await expect(service.signUp('user@example.com', 'secret', 'User')).rejects.toThrow('غير مهيأة');
    await expect(service.signInWithGoogle('http://localhost:3000')).rejects.toThrow('غير مهيأة');
    await expect(service.getSessionUser()).resolves.toBeNull();
    await expect(service.getCurrentUser()).resolves.toBeNull();
    await expect(service.signOut()).resolves.toBeUndefined();
    expect(service.onAuthStateChange(() => undefined)).toBeTypeOf('function');
  });

  it('delegates password auth and maps the returned user', async () => {
    const client = {
      auth: {
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', email: 'user@example.com' }, session: {} }, error: null }),
        signUp: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'u1', email: 'user@example.com' }, session: {} }, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'user@example.com' } } }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'user@example.com' } }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      },
    };
    const service = createAuthService(client as never);

    await expect(service.signInWithPassword('user@example.com', 'secret')).resolves.toMatchObject({ id: 'u1' });
    await expect(service.signUp('user@example.com', 'secret', 'User')).resolves.toMatchObject({ hasSession: true });
    await service.signInWithGoogle('http://localhost:3000');
    await expect(service.getSessionUser()).resolves.toMatchObject({ email: 'user@example.com' });
    await expect(service.getCurrentUser()).resolves.toMatchObject({ id: 'u1' });
    await service.signOut();
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000' },
    });
    expect(client.auth.signOut).toHaveBeenCalledOnce();
  });

  it('normalizes provider errors into service errors', async () => {
    const service = createAuthService({
      auth: {
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ data: { user: null, session: null }, error: { message: 'invalid login' } }),
      },
    } as never);
    await expect(service.signInWithPassword('user@example.com', 'bad')).rejects.toMatchObject({ code: 'unknown' });
    await expect(service.signInWithPassword('user@example.com', 'bad')).rejects.toThrow('تعذر تسجيل الدخول');
  });
});
