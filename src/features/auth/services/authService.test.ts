import { describe, expect, it } from 'vitest';
import { mapAuthUser } from './authService';

describe('auth service boundary', () => {
  it('maps a Supabase user to the app auth shape', () => {
    expect(mapAuthUser({ id: 'user-1', email: 'user@example.com' } as never)).toEqual({ id: 'user-1', email: 'user@example.com', isGuest: false });
  });

  it('rejects a user without an email', () => {
    expect(() => mapAuthUser({ id: 'user-1' } as never)).toThrow('لا يحتوي');
  });
});
