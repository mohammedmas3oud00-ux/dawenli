import { describe, expect, it } from 'vitest';
import { minutesToTime, parseLocalDateKey, shiftLocalDateKey, timeToMinutes, toLocalDateKey } from './date';

describe('local date utilities', () => {
  it('does not convert a local late evening into the next UTC date', () => {
    const date = new Date(2026, 8, 24, 23, 30);
    expect(toLocalDateKey(date)).toBe('2026-09-24');
  });

  it('shifts dates across month boundaries without UTC parsing', () => {
    expect(shiftLocalDateKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('validates same-day clock values', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
    expect(timeToMinutes('24:00')).toBeNull();
    expect(minutesToTime(1440)).toBeNull();
  });

  it('round-trips minutes through clock strings', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(75)).toBe('01:15');
    expect(timeToMinutes('01:15')).toBe(75);
  });

  it('rejects malformed and out-of-range local dates', () => {
    expect(() => parseLocalDateKey('2026-13-01')).toThrow('Invalid local date');
    expect(() => parseLocalDateKey('not-a-date')).toThrow('Invalid local date');
  });

  it('parses local keys into local midnight', () => {
    const parsed = parseLocalDateKey('2026-09-24');
    expect(toLocalDateKey(parsed)).toBe('2026-09-24');
    expect(parsed.getDay()).toBe(new Date(2026, 8, 24).getDay());
  });
});
