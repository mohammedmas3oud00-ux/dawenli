import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

type FunctionRequest = { headers: Record<string, string | string[] | undefined> };
type FunctionResponse = { status: (status: number) => FunctionResponse; json: (body: unknown) => void };
type CalendarEvent = { id: string; title: string; start_at: string; timezone?: string; recurrence?: { frequency?: string; interval?: number; days_of_week?: number[]; until?: string | null }; reminder_minutes?: number | null; all_day?: boolean };

const errorJson = (response: FunctionResponse, status: number, code: string, message: string) => response.status(status).json({ ok: false, error: { code, message } });
const localParts = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, minute: Number(values.hour) * 60 + Number(values.minute), weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday) };
};
const addDays = (date: string, days: number) => { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
const dayDifference = (from: string, to: string) => Math.floor((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);

function occursOn(event: CalendarEvent, date: string) {
  const timezone = event.timezone || 'Africa/Cairo';
  const start = localParts(new Date(event.start_at), timezone);
  const rule = event.recurrence || { frequency: 'none', interval: 1 };
  if (date < start.date || (rule.until && date > rule.until)) return false;
  const diff = dayDifference(start.date, date);
  if (rule.frequency === 'none') return date === start.date;
  if (rule.frequency === 'daily') return diff % Math.max(1, rule.interval || 1) === 0;
  if (rule.frequency === 'weekly') {
    const weekdays = rule.days_of_week?.length ? rule.days_of_week : [start.weekday];
    return Math.floor(diff / 7) % Math.max(1, rule.interval || 1) === 0 && weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay());
  }
  if (rule.frequency === 'monthly') {
    const first = new Date(`${start.date}T12:00:00Z`); const current = new Date(`${date}T12:00:00Z`);
    const months = (current.getUTCFullYear() - first.getUTCFullYear()) * 12 + current.getUTCMonth() - first.getUTCMonth();
    return months % Math.max(1, rule.interval || 1) === 0 && current.getUTCDate() === first.getUTCDate();
  }
  return false;
}

export default async function dispatch(request: FunctionRequest, response: FunctionResponse): Promise<void> {
  const expectedSecret = (process.env.CRON_SECRET || '').trim();
  const authorization = request.headers.authorization;
  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) { errorJson(response, 401, 'UNAUTHORIZED', 'Cron authorization required.'); return; }
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const publicKey = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (!url || !serviceKey || !publicKey || !privateKey) { errorJson(response, 503, 'NOT_CONFIGURED', 'خدمة الإشعارات الخلفية غير مهيأة.'); return; }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  webpush.setVapidDetails('mailto:support@dawenli.app', publicKey, privateKey);
  const { data: subscriptions, error: subscriptionsError } = await admin.from('push_subscriptions').select('*');
  if (subscriptionsError) { errorJson(response, 503, 'UPSTREAM_ERROR', 'تعذر تحميل اشتراكات الإشعارات.'); return; }
  const now = new Date(); let delivered = 0;
  for (const subscription of subscriptions || []) {
    if (subscription.calendar_enabled === false) continue;
    const timezone = subscription.timezone || 'Africa/Cairo'; const current = localParts(now, timezone);
    const { data: events } = await admin.from('calendar_events').select('id,title,start_at,timezone,recurrence,reminder_minutes,all_day').eq('user_id', subscription.user_id).eq('is_cancelled', false).not('reminder_minutes', 'is', null);
    for (const event of (events || []) as CalendarEvent[]) {
      const eventTimezone = event.timezone || timezone; const start = localParts(new Date(event.start_at), eventTimezone); const reminder = Number(event.reminder_minutes || 0);
      const notificationMinute = (start.minute - reminder + 1440) % 1440;
      if (current.minute !== notificationMinute) continue;
      const occurrenceDate = start.minute - reminder < 0 ? addDays(current.date, 1) : current.date;
      if (!occursOn(event, occurrenceDate)) continue;
      const deliveryKey = `calendar:${event.id}:${occurrenceDate}:${reminder}`;
      const { data: reservation, error: reservationError } = await admin.from('push_delivery_log').insert({ subscription_id: subscription.id, delivery_key: deliveryKey }).select('id').maybeSingle();
      if (reservationError || !reservation) continue;
      try {
        const body = event.all_day ? 'لديك موعد طوال اليوم.' : `يبدأ بعد ${reminder} دقيقة.`;
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: `موعدك: ${event.title}`, body, deliveryKey, url: '/' }));
        delivered += 1;
      } catch (sendError: any) {
        await admin.from('push_delivery_log').delete().eq('id', reservation.id);
        if (sendError?.statusCode === 404 || sendError?.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', subscription.id);
      }
    }
  }
  response.status(200).json({ ok: true, data: { delivered } });
}
