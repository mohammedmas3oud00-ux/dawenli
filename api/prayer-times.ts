type PrayerTiming = Record<string, string | undefined>;

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Keeps public prayer-time lookups independent from authenticated AI services. */
export default async function prayerTimes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const latitude = url.searchParams.has('lat') ? Number(url.searchParams.get('lat')) : 30.0444;
  const longitude = url.searchParams.has('lng') ? Number(url.searchParams.get('lng')) : 31.2357;
  const city = url.searchParams.get('city')?.trim() ?? '';
  const country = url.searchParams.get('country')?.trim() ?? '';

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return json({ ok: false, error: { code: 'BAD_REQUEST', message: 'إحداثيات الموقع غير صالحة.', requestId: crypto.randomUUID() } }, 400);
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
    return json({ ok: true, data: {
      Fajr: toTime(timings.Fajr), Sunrise: toTime(timings.Sunrise), Dhuhr: toTime(timings.Dhuhr),
      Asr: toTime(timings.Asr), Maghrib: toTime(timings.Maghrib), Isha: toTime(timings.Isha),
      date: payload.data?.date?.readable ?? '', hijri: payload.data?.date?.hijri?.date ?? '',
      hijriMonthArabic: payload.data?.date?.hijri?.month?.ar ?? '',
    } });
  } catch {
    return json({ ok: false, error: { code: 'UPSTREAM_ERROR', message: 'تعذر جلب مواقيت الصلاة الدقيقة. فعّل الموقع أو حاول لاحقًا.', requestId: crypto.randomUUID() } }, 502);
  }
}
