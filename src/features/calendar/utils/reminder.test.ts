import { describe, expect, it } from 'vitest';
import { formatReminderOffset, MAX_CALENDAR_REMINDER_MINUTES, parseReminderMinutes } from './reminder';

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

  it('enforces the seven-day ceiling exactly', () => {
    expect(parseReminderMinutes(String(MAX_CALENDAR_REMINDER_MINUTES))).toEqual({
      value: MAX_CALENDAR_REMINDER_MINUTES,
      error: null,
    });
  });

  it('formats long reminder offsets', () => {
    expect(formatReminderOffset(1500)).toBe('يوم وساعة');
  });

  it('pluralizes hours and days in Arabic', () => {
    expect(formatReminderOffset(45)).toBe('45 دقيقة');
    expect(formatReminderOffset(60)).toBe('ساعة');
    expect(formatReminderOffset(120)).toBe('ساعتين');
    expect(formatReminderOffset(180)).toBe('3 ساعات');
    expect(formatReminderOffset(1440)).toBe('يوم');
    expect(formatReminderOffset(2880)).toBe('يومين');
    expect(formatReminderOffset(4320)).toBe('3 أيام');
  });
});
