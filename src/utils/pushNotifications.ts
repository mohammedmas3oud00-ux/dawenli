import { supabase } from './supabaseClient';

async function authHeaders() {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error('سجّل الدخول لتفعيل إشعارات الخلفية.');
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
}

export type PushNotificationPreferences = {
  prayerEnabled?: boolean; taskEnabled?: boolean; worshipEnabled?: boolean;
  adhkarEnabled?: boolean; quranEnabled?: boolean; qiyamEnabled?: boolean;
  sleepEnabled?: boolean; streakEnabled?: boolean; calendarEnabled?: boolean;
};

export async function subscribeToPush(prayerTimes: Record<string, string> = {}, options: PushNotificationPreferences = {}): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('هذا المتصفح لا يدعم إشعارات الخلفية.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('لم يتم منح إذن الإشعارات.');
  const keyResponse = await fetch('/api/push/public-key', { headers: { Accept: 'application/json' } });
  const keyBody = await keyResponse.json().catch(() => null) as { data?: { publicKey?: string }; error?: { message?: string } } | null;
  if (!keyResponse.ok || !keyBody?.data?.publicKey) throw new Error(keyBody?.error?.message || 'إشعارات الخلفية غير مهيأة.');
  const applicationServerKey = urlBase64ToUint8Array(keyBody.data.publicKey);
  if (applicationServerKey.byteLength !== 65) throw new Error('مفتاح إشعارات الخلفية غير صالح. أعد المحاولة بعد تحديث الصفحة.');
  const registration = await navigator.serviceWorker.ready;
  const previousSubscription = await registration.pushManager.getSubscription();
  if (previousSubscription) await previousSubscription.unsubscribe();
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey as unknown as BufferSource });
  const payload: Record<string, unknown> = { subscription, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  for (const key of ['prayerEnabled', 'taskEnabled', 'worshipEnabled', 'adhkarEnabled', 'quranEnabled', 'qiyamEnabled', 'sleepEnabled', 'streakEnabled', 'calendarEnabled'] as const) {
    if (typeof options[key] === 'boolean') payload[key] = options[key];
  }
  if (Object.keys(prayerTimes).length) payload.prayerTimes = prayerTimes;
  const response = await fetch('/api/push/subscription', { method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('تعذر حفظ إعداد إشعارات الخلفية.');
}

export async function getPushPreferences(): Promise<PushNotificationPreferences | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;
  const response = await fetch(`/api/push/subscription?endpoint=${encodeURIComponent(subscription.endpoint)}`, { headers: await authHeaders() });
  if (!response.ok) throw new Error('تعذر تحميل إعدادات الإشعارات المحفوظة.');
  const { data } = await response.json();
  if (!data) return null;
  return Object.fromEntries(['prayer', 'task', 'worship', 'adhkar', 'quran', 'qiyam', 'sleep', 'streak', 'calendar'].map((name) => [`${name}Enabled`, data[`${name}_enabled`] !== false]));
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}
