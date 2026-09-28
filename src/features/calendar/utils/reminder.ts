export const MAX_CALENDAR_REMINDER_MINUTES = 7 * 24 * 60;

export type ReminderParseResult = { value: number | null; error: null } | { value: null; error: string };

export function parseReminderMinutes(rawValue: string): ReminderParseResult {
  const normalized = rawValue.trim();
  if (!normalized) return { value: null, error: null };
  if (!/^\d+$/.test(normalized)) {
    return { value: null, error: 'أدخل عددًا صحيحًا من الدقائق للتذكير.' };
  }

  const minutes = Number(normalized);
  if (!Number.isSafeInteger(minutes) || minutes > MAX_CALENDAR_REMINDER_MINUTES) {
    return { value: null, error: 'يجب أن يكون التذكير بين 0 و10080 دقيقة (7 أيام).' };
  }

  return { value: minutes, error: null };
}

export function formatReminderOffset(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;

  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const remainingMinutes = minutes % 60;
  const parts: string[] = [];

  if (days) parts.push(days === 1 ? 'يوم' : days === 2 ? 'يومين' : `${days} أيام`);
  if (hours) parts.push(hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : `${hours} ساعات`);
  if (remainingMinutes) parts.push(`${remainingMinutes} دقيقة`);

  return parts.join(' و');
}
