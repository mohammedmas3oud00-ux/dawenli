/** Resolve symbolic worship periods using the user's stored prayer times.
 * Quran/custom anytime reminders use 18:00 local time; night is one hour after Isha.
 * Missing prayer times do not manufacture a religious time.
 */
export function worshipReminderTime(
  period: string | null | undefined,
  prayerTimes: Record<string, unknown>,
): string | null {
  if (period === 'anytime' || !period) return '18:00';
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(period)) return period;
  const names: Record<string, string> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    morning: 'Fajr',
    evening: 'Asr',
    night: 'Isha',
  };
  const value = String(prayerTimes[names[period]] ?? '').slice(0, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  if (period !== 'night') return value;
  const [hours, minutes] = value.split(':').map(Number);
  return `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
