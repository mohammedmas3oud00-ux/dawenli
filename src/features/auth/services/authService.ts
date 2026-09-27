import type { SupabaseClient, User } from '@supabase/supabase-js';
import { ServiceError, toServiceError } from '../../../shared/services/repositoryErrors';
import { isSupabaseConfigured, supabase } from '../../../shared/services/supabaseClient';

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'guest'; user: { email: string; isGuest: true; id?: string } }
  | { status: 'authenticated'; user: { email: string; isGuest?: false; id: string } };

export { isSupabaseConfigured };
export const authService = createAuthService(isSupabaseConfigured ? supabase : null);

export function mapAuthUser(user: User) {
  if (!user.email) throw new ServiceError('unauthorized', 'حساب المصادقة لا يحتوي على بريد إلكتروني.');
  return { id: user.id, email: user.email, isGuest: false as const };
}

export function createAuthService(client: SupabaseClient | null) {
  return {
    async signInWithPassword(email: string, password: string) {
      if (!client) throw new ServiceError('unknown', 'المصادقة السحابية غير مهيأة.');
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user?.email || !data.session) throw new ServiceError('unauthorized', 'لم تُنشأ جلسة دخول صالحة.');
        return mapAuthUser(data.user);
      } catch (error) { throw toServiceError(error, 'تعذر تسجيل الدخول.'); }
    },
    async signUp(email: string, password: string, fullName: string) {
      if (!client) throw new ServiceError('unknown', 'المصادقة السحابية غير مهيأة.');
      try {
        const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        return { user: data.user?.email ? mapAuthUser(data.user) : null, hasSession: Boolean(data.session) };
      } catch (error) { throw toServiceError(error, 'تعذر إنشاء الحساب.'); }
    },
    async signInWithGoogle(redirectTo: string) {
      if (!client) throw new ServiceError('unknown', 'المصادقة السحابية غير مهيأة.');
      try {
        const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        if (error) throw error;
      } catch (error) { throw toServiceError(error, 'تعذر بدء تسجيل Google.'); }
    },
    async getSessionUser() {
      if (!client) return null;
      try {
        const { data, error } = await client.auth.getSession();
        if (error || !data.session?.user?.email) return null;
        return mapAuthUser(data.session.user);
      } catch (error) {
        throw toServiceError(error, 'تعذر تحميل جلسة الحساب.');
      }
    },
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
