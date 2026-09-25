import { supabase } from './supabaseClient';

async function authHeaders() {
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  if (!data.session?.access_token) throw new Error('سجّل الدخول لتفعيل إشعارات الخلفية.');
  return { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
}

export type PushNotificationPreferences = { prayerEnabled?: boolean; taskEnabled?: boolean; worshipEnabled?: boolean };

export async function subscribeToPush(prayerTimes: Record<string, string> = {}, options: PushNotificationPreferences = {}): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('هذا المتصفح لا يدعم إشعارات الخلفية.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('لم يتم منح إذن الإشعارات.');
  const keyResponse = await fetch('/api/push/public-key');
  const keyBody = await keyResponse.json() as { data?: { publicKey?: string }; error?: { message?: string } };
  if (!keyResponse.ok || !keyBody.data?.publicKey) throw new Error(keyBody.error?.message || 'إشعارات الخلفية غير مهيأة.');
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyBody.data.publicKey) as unknown as BufferSource });
  const payload: Record<string, unknown> = { subscription, prayerEnabled: options.prayerEnabled !== false, taskEnabled: options.taskEnabled !== false, worshipEnabled: options.worshipEnabled !== false, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  if (Object.keys(prayerTimes).length) payload.prayerTimes = prayerTimes;
  const response = await fetch('/api/push/subscription', { method: 'POST', headers: await authHeaders(), body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('تعذر حفظ إعداد إشعارات الخلفية.');
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}
