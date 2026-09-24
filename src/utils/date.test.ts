import { describe, expect, it, vi } from 'vitest';
import { minutesToTime, shiftLocalDateKey, timeToMinutes, toLocalDateKey } from './date';

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
});
