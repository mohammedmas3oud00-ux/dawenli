import { describe, expect, it } from 'vitest';
import { worshipReminderTime } from './worshipReminderTime';

describe('worship reminder periods', () => {
  it('resolves symbolic periods, not Sunrise', () => {
    const times = { Fajr: '05:12', Asr: '15:30', Isha: '20:05', Sunrise: '06:20' };
    expect(worshipReminderTime('morning', times)).toBe('05:12');
    expect(worshipReminderTime('evening', times)).toBe('15:30');
    expect(worshipReminderTime('night', times)).toBe('21:05');
    expect(worshipReminderTime('sunrise', times)).toBeNull();
  });
  it('does not invent missing prayer times and validates explicit times', () => {
    expect(worshipReminderTime('fajr', {})).toBeNull();
    expect(worshipReminderTime('25:99', {})).toBeNull();
    expect(worshipReminderTime('09:15', {})).toBe('09:15');
    expect(worshipReminderTime('anytime', {})).toBe('18:00');
    expect(worshipReminderTime('night', { Isha: '23:30' })).toBe('00:30');
  });
});
