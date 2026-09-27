import type { SupabaseClient, User } from '@supabase/supabase-js';
import { ServiceError, toServiceError } from '../../../shared/services/repositoryErrors';

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'guest'; user: { email: string; isGuest: true; id?: string } }
  | { status: 'authenticated'; user: { email: string; isGuest?: false; id: string } };

export function mapAuthUser(user: User) {
  if (!user.email) throw new ServiceError('unauthorized', 'حساب المصادقة لا يحتوي على بريد إلكتروني.');
  return { id: user.id, email: user.email, isGuest: false as const };
}

export function createAuthService(client: SupabaseClient | null) {
  return {
    async getCurrentUser() {
      if (!client) return null;
      try {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) return null;
        return mapAuthUser(data.user);
      } catch (error) {
        throw toServiceError(error, 'تعذر التحقق من جلسة الحساب.');
      }
    },
    onAuthStateChange(callback: (user: ReturnType<typeof mapAuthUser> | null) => void) {
      if (!client) return () => undefined;
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ? mapAuthUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },
    async signOut() {
      if (!client) return;
      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      } catch (error) {
        throw toServiceError(error, 'تعذر تسجيل الخروج.');
      }
    },
  };
}
