import { describe, expect, it } from 'vitest';
import { shouldRefreshPrayerTimes } from './prayerTimesRefresh';

describe('prayer times refresh policy', () => {
  it('refreshes only after local date rollover while visible', () => {
    expect(shouldRefreshPrayerTimes('2026-10-01', '2026-10-02', 'visible')).toBe(true);
    expect(shouldRefreshPrayerTimes('2026-10-01', '2026-10-02', 'hidden')).toBe(false);
    expect(shouldRefreshPrayerTimes('2026-10-02', '2026-10-02', 'visible')).toBe(false);
  });
});
