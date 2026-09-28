import { describe, expect, it } from 'vitest';
import { formatReminderOffset, parseReminderMinutes } from './reminder';

describe('calendar reminder validation', () => {
  it('accepts empty or bounded whole-minute values', () => {
    expect(parseReminderMinutes('')).toEqual({ value: null, error: null });
    expect(parseReminderMinutes('1440')).toEqual({ value: 1440, error: null });
    expect(parseReminderMinutes('10081').error).toBeTruthy();
  });

  it('rejects fractional and non-numeric values', () => {
    expect(parseReminderMinutes('1.5').error).toBeTruthy();
    expect(parseReminderMinutes('-1').error).toBeTruthy();
  });

  it('formats long reminder offsets', () => {
    expect(formatReminderOffset(1500)).toBe('يوم وساعة');
  });
});
