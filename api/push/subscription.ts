import { createClient } from '@supabase/supabase-js';

type FunctionRequest = { method?: string; headers: Record<string, string | string[] | undefined>; query: Record<string, string | string[] | undefined>; body?: any };
type FunctionResponse = { status: (status: number) => FunctionResponse; json: (body: unknown) => void };

const getUrl = () => (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const getAnonKey = () => (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const jsonError = (response: FunctionResponse, status: number, code: string, message: string) => response.status(status).json({ ok: false, error: { code, message } });

async function authenticatedClient(request: FunctionRequest, response: FunctionResponse) {
  const url = getUrl();
  const anonKey = getAnonKey();
  const authorization = request.headers.authorization;
  const token = typeof authorization === 'string' ? authorization.match(/^Bearer\s+(.+)$/i)?.[1] : undefined;
  if (!url || !anonKey) { jsonError(response, 503, 'NOT_CONFIGURED', 'خدمة المزامنة غير مهيأة.'); return null; }
  if (!token) { jsonError(response, 401, 'UNAUTHORIZED', 'جلسة المستخدم مطلوبة.'); return null; }
  const client = createClient(url, anonKey, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) { jsonError(response, 401, 'UNAUTHORIZED', 'جلسة المستخدم غير صالحة أو منتهية.'); return null; }
  return { client, userId: data.user.id };
}

function bodyOf(request: FunctionRequest) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') { try { return JSON.parse(request.body); } catch { return {}; } }
  return {};
}

export default async function subscription(request: FunctionRequest, response: FunctionResponse): Promise<void> {
  const method = (request.method || 'GET').toUpperCase();
  const auth = await authenticatedClient(request, response);
  if (!auth) return;
  const { client, userId } = auth;
  const body = bodyOf(request);
  const endpoint = typeof (body.endpoint || request.query.endpoint) === 'string' ? (body.endpoint || request.query.endpoint) : '';
  if (!endpoint) { jsonError(response, 400, 'BAD_REQUEST', 'رابط الاشتراك مطلوب.'); return; }

  if (method === 'GET') {
    const { data, error } = await client.from('push_subscriptions').select('prayer_enabled,task_enabled,worship_enabled,adhkar_enabled,quran_enabled,qiyam_enabled,sleep_enabled,streak_enabled,calendar_enabled').eq('endpoint', endpoint).eq('user_id', userId).maybeSingle();
    if (error) { jsonError(response, 503, 'UPSTREAM_ERROR', 'تعذر تحميل إعدادات الإشعارات.'); return; }
    response.status(200).json({ ok: true, data }); return;
  }

  if (method === 'DELETE') {
    const { error } = await client.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', userId);
    if (error) { jsonError(response, 503, 'UPSTREAM_ERROR', 'تعذر حذف اشتراك الإشعارات.'); return; }
    response.status(200).json({ ok: true, data: { subscribed: false } }); return;
  }

  if (method !== 'POST') { jsonError(response, 405, 'METHOD_NOT_ALLOWED', 'طريقة الطلب غير مدعومة.'); return; }
  const subscription = body.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) { jsonError(response, 400, 'BAD_REQUEST', 'اشتراك الإشعارات غير صالح.'); return; }
  const { data: existing, error: readError } = await client.from('push_subscriptions').select('*').eq('endpoint', subscription.endpoint).eq('user_id', userId).maybeSingle();
  if (readError) { jsonError(response, 503, 'UPSTREAM_ERROR', 'تعذر قراءة إعدادات الإشعارات الحالية.'); return; }
  const preference = (key: string, column: string) => typeof body[key] === 'boolean' ? body[key] : existing?.[column] !== false;
  const { error } = await client.from('push_subscriptions').upsert({
    user_id: userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth,
    prayer_enabled: preference('prayerEnabled', 'prayer_enabled'), task_enabled: preference('taskEnabled', 'task_enabled'), worship_enabled: preference('worshipEnabled', 'worship_enabled'),
    adhkar_enabled: preference('adhkarEnabled', 'adhkar_enabled'), quran_enabled: preference('quranEnabled', 'quran_enabled'), qiyam_enabled: preference('qiyamEnabled', 'qiyam_enabled'),
    sleep_enabled: preference('sleepEnabled', 'sleep_enabled'), streak_enabled: preference('streakEnabled', 'streak_enabled'), calendar_enabled: preference('calendarEnabled', 'calendar_enabled'),
    timezone: typeof body.timezone === 'string' ? body.timezone.slice(0, 80) : existing?.timezone || 'Africa/Cairo', prayer_times: body.prayerTimes && typeof body.prayerTimes === 'object' ? body.prayerTimes : existing?.prayer_times || {}, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,endpoint' });
  if (error) { jsonError(response, 503, 'UPSTREAM_ERROR', 'تعذر حفظ اشتراك الإشعارات.'); return; }
  response.status(200).json({ ok: true, data: { subscribed: true } });
}
