type PrayerTiming = Record<string, string | undefined>;
type FunctionRequest = { query: Record<string, string | string[] | undefined> };
type FunctionResponse = { status: (status: number) => FunctionResponse; json: (body: unknown) => void };

/** Keeps public prayer-time lookups independent from authenticated AI services. */
export default async function prayerTimes(request: FunctionRequest, response: FunctionResponse): Promise<void> {
  const value = (name: string) => typeof request.query[name] === 'string' ? request.query[name] : undefined;
  const latitude = value('lat') !== undefined ? Number(value('lat')) : 30.0444;
  const longitude = value('lng') !== undefined ? Number(value('lng')) : 31.2357;
  const city = value('city')?.trim() ?? '';
  const country = value('country')?.trim() ?? '';

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    response.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'إحداثيات الموقع غير صالحة.', requestId: crypto.randomUUID() } });
    return;
  }

  try {
    const endpoint = city && country
      ? `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`
      : `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=5`;
    const upstream = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!upstream.ok) throw new Error(`Prayer provider returned ${upstream.status}`);
    const payload = await upstream.json() as { data?: { timings?: PrayerTiming; date?: { readable?: string; hijri?: { date?: string; month?: { ar?: string } } } } };
    const timings = payload.data?.timings ?? {};
    const toTime = (value?: string) => value?.slice(0, 5) ?? '';
    response.status(200).json({ ok: true, data: {
      Fajr: toTime(timings.Fajr), Sunrise: toTime(timings.Sunrise), Dhuhr: toTime(timings.Dhuhr),
      Asr: toTime(timings.Asr), Maghrib: toTime(timings.Maghrib), Isha: toTime(timings.Isha),
      date: payload.data?.date?.readable ?? '', hijri: payload.data?.date?.hijri?.date ?? '',
      hijriMonthArabic: payload.data?.date?.hijri?.month?.ar ?? '',
    } });
  } catch {
    response.status(502).json({ ok: false, error: { code: 'UPSTREAM_ERROR', message: 'تعذر جلب مواقيت الصلاة الدقيقة. فعّل الموقع أو حاول لاحقًا.', requestId: crypto.randomUUID() } });
  }
}
