import { describe, expect, it } from 'vitest';
import { changeWorshipSettings, configuredProgression, targetStreak } from './ibadat';
import type { WorshipDefinition, WorshipLog } from '../types/hierarchical';
import {
  hijriDate,
  isEditableWorshipDate,
  isWorshipScheduled,
  isWorshipComplete,
  progressionSuggestion,
  updateWorshipLog,
  worshipInsights,
  worshipStreak,
  worshipSummary,
  worshipProgress,
} from './ibadat';

const definition = (id: string): WorshipDefinition => ({
  id,
  pillar_id: 'pillar',
  title: id,
  category: 'salah',
  tracking_type: 'multi_option',
  frequency: 'daily',
  is_active: true,
  sort_order: 0,
  created_at: '2026-09-01T00:00:00Z',
});
const log = (worship_id: string, date: string): WorshipLog => ({
  id: `${worship_id}-${date}`,
  worship_id,
  date,
  is_completed: true,
  created_at: `${date}T00:00:00Z`,
});

describe('ibadat calculations', () => {
  it('preserves yesterday target after increasing Quran today', () => {
    const initial: WorshipDefinition = {
      ...definition('quran'),
      category: 'quran_wird',
      tracking_type: 'pages',
      target_pages: 5,
    };
    const changed = changeWorshipSettings(initial, { target_pages: 10 }, '2026-09-27');
    expect(isWorshipComplete(changed, { ...log('quran', '2026-09-26'), pages_read: 5 })).toBe(true);
    expect(isWorshipComplete(changed, { ...log('quran', '2026-09-27'), pages_read: 5 })).toBe(false);
    const again = changeWorshipSettings(changed, { target_pages: 15 }, '2026-09-27');
    expect(again.settings_history).toHaveLength(2);
    expect(isWorshipComplete(again, { ...log('quran', '2026-09-26'), pages_read: 5 })).toBe(true);
  });
  it('does not retrospectively remove scheduled fasting days', () => {
    const initial: WorshipDefinition = {
      ...definition('fasting'),
      category: 'fasting',
      frequency: 'custom',
      scheduled_days: [1, 4],
    };
    const changed = changeWorshipSettings(initial, { scheduled_days: [] }, '2026-09-27');
    expect(isWorshipScheduled(changed, '2026-09-24')).toBe(true);
    expect(isWorshipScheduled(changed, '2026-09-28')).toBe(false);
  });
  it('uses configurable duration and quantitative targets for a continuing streak', () => {
    const d: WorshipDefinition = {
      ...definition('quran'),
      category: 'quran_wird',
      tracking_type: 'pages',
      target_pages: 5,
      progression_days: 30,
    };
    const path = {
      id: 'p',
      worship_id: d.id,
      title: '',
      stages: [],
      current_stage_index: 0,
      stage_start_date: '2026-09-01',
      consecutive_days: 100,
      auto_promote: false,
      created_at: '2026-09-01',
    };
    expect(configuredProgression(path, d).stages[0]).toMatchObject({ target_value: 5, days_required: 30 });
    expect(configuredProgression(path, d).stages[1].target_value).toBe(7.5);
    const logs = [24, 25, 26].map((day) => ({ ...log('quran', `2026-09-${day}`), pages_read: day === 25 ? 1 : 5 }));
    expect(targetStreak(d, logs, path.stage_start_date, '2026-09-27')).toBe(1);
  });
  it('does not penalize Monday/Thursday fasting on Sunday', () => {
    const fasting: WorshipDefinition = {
      ...definition('fasting'),
      category: 'fasting',
      frequency: 'custom',
      scheduled_days: [1, 4],
    };
    expect(isWorshipScheduled(fasting, '2026-09-27')).toBe(false);
    expect(worshipSummary([fasting], [], '2026-09-27').total).toBe(0);
    expect(worshipSummary([fasting], [], '2026-09-28')).toMatchObject({ total: 1, completed: 0 });
    expect(isWorshipScheduled(fasting, '2026-10-01')).toBe(true);
  });
  it('scores only selected Hijri dates when weekdays are disabled', () => {
    const date = '2026-09-27';
    const day = hijriDate(new Date(2026, 8, 27)).day;
    const fasting: WorshipDefinition = {
      ...definition('fasting'),
      category: 'fasting',
      scheduled_days: [],
      scheduled_hijri_days: [day],
    };
    expect(isWorshipScheduled(fasting, date)).toBe(true);
    expect(isWorshipScheduled({ ...fasting, scheduled_hijri_days: [] }, date)).toBe(false);
  });
  it('requires the configured quantitative target, not a completion checkbox alone', () => {
    const quran: WorshipDefinition = {
      ...definition('quran'),
      category: 'quran_wird',
      tracking_type: 'pages',
      target_pages: 5,
    };
    expect(isWorshipComplete(quran, log('quran', '2026-09-27'))).toBe(false);
    expect(isWorshipComplete(quran, { ...log('quran', '2026-09-27'), pages_read: 5 })).toBe(true);
    const qiyam: WorshipDefinition = { ...definition('qiyam'), category: 'qiyam', target_count: 4 };
    expect(isWorshipComplete(qiyam, { ...log('qiyam', '2026-09-27'), rakaat_count: 2 })).toBe(false);
  });
  it('normalizes legacy Quran targets below one quarter', () => {
    const quran: WorshipDefinition = {
      ...definition('quran'),
      category: 'quran_wird',
      tracking_type: 'pages',
      target_pages: 1,
    };
    expect(isWorshipComplete(quran, { ...log('quran', '2026-09-27'), pages_read: 1 })).toBe(false);
    expect(isWorshipComplete(quran, { ...log('quran', '2026-09-27'), pages_read: 5 })).toBe(true);
    expect(
      configuredProgression(
        {
          id: 'p',
          worship_id: 'quran',
          title: '',
          stages: [],
          current_stage_index: 0,
          stage_start_date: '2026-09-27',
          consecutive_days: 0,
          auto_promote: false,
          created_at: '2026-09-27',
        },
        quran,
      ).stages[0].target_value,
    ).toBe(2.5);
  });
  it('counts partial rakaat progress without marking the worship complete', () => {
    const sunnah: WorshipDefinition = {
      ...definition('sunnah'),
      category: 'sunnah_rawatib',
      tracking_type: 'counter',
      target_count: 4,
    };
    const partial = { ...log('sunnah', '2026-09-27'), count: 2, is_completed: false };
    expect(isWorshipComplete(sunnah, partial)).toBe(false);
    expect(worshipProgress(sunnah, partial)).toBe(0.5);
    expect(worshipSummary([sunnah], [partial], '2026-09-27')).toMatchObject({ completed: 0, partial: 1, rate: 50 });
  });

  it('preserves yesterday streak while today is unfinished', () => {
    expect(worshipStreak([definition('fajr')], [log('fajr', '2026-09-26')], '2026-09-27')).toBe(1);
  });
  it('rejects empty, invalid and normalized dates', () => {
    for (const value of ['', 'invalid', '2026-02-30', '2026-13-01']) {
      expect(isEditableWorshipDate(value, '2026-03-01')).toBe(false);
    }
  });

  it('retains completion time when editing prayer details and clears it on reopening', () => {
    const prior = { ...log('fajr', '2026-09-25'), completed_at: '2026-09-25T03:00:00Z' };
    const changed = updateWorshipLog(definition('fajr'), prior.date, prior, { congregation: 'jamaah' });
    expect(changed.completed_at).toBe(prior.completed_at);
    expect(changed.id).toBe(prior.id);
    expect(updateWorshipLog(definition('fajr'), prior.date, changed, { is_completed: false }).completed_at).toBeNull();
  });

  it('turns an unselected congregation into nullable data for Supabase', () => {
    const changed = updateWorshipLog(definition('fajr'), '2026-09-25', undefined, { congregation: '' as never });
    expect(changed.congregation).toBeNull();
  });

  it('keeps private amounts independent of completion', () => {
    const prior = log('charity', '2026-09-25');
    const changed = updateWorshipLog(definition('charity'), prior.date, prior, { amount: null });
    expect(changed.is_completed).toBe(true);
    expect(worshipSummary([definition('charity')], [changed], prior.date).rate).toBe(100);
  });
  it('accepts today and the previous thirty days only', () => {
    expect(isEditableWorshipDate('2026-09-25', '2026-09-25')).toBe(true);
    expect(isEditableWorshipDate('2026-08-26', '2026-09-25')).toBe(true);
    expect(isEditableWorshipDate('2026-08-25', '2026-09-25')).toBe(false);
    expect(isEditableWorshipDate('2026-09-26', '2026-09-25')).toBe(false);
  });

  it('calculates completion and streak only when all enabled daily worships are complete', () => {
    const definitions = [definition('fajr'), definition('dhuhr')];
    const logs = [
      log('fajr', '2026-09-25'),
      log('dhuhr', '2026-09-25'),
      log('fajr', '2026-09-24'),
      log('dhuhr', '2026-09-24'),
    ];
    expect(worshipSummary(definitions, logs, '2026-09-25')).toMatchObject({ completed: 2, total: 2, rate: 100 });
    expect(worshipStreak(definitions, logs, '2026-09-25')).toBe(2);
  });

  it('suggests, rather than auto-promotes, a completed progression stage', () => {
    const path = {
      id: 'path',
      worship_id: 'qiyam',
      title: 'قيام',
      stages: [
        { index: 0, title: 'البداية', description: '', target_value: 2, days_required: 7 },
        { index: 1, title: 'التالي', description: '', target_value: 4, days_required: 7 },
      ],
      current_stage_index: 0,
      stage_start_date: '2026-09-01',
      consecutive_days: 7,
      auto_promote: false,
      created_at: '2026-09-01',
    };
    expect(progressionSuggestion(path, [])).toBeNull();
    const logs = Array.from({ length: 7 }, (_, i) => ({ ...log('qiyam', `2026-09-0${i + 1}`), rakaat_count: 2 }));
    expect(progressionSuggestion(path, logs)).toContain('هل تريد');
  });

  it('returns a usable Hijri date without relying on UTC string conversion', () => {
    const value = hijriDate(new Date(2026, 8, 25, 12));
    expect(value.day).toBeGreaterThanOrEqual(1);
    expect(value.month).toBeGreaterThanOrEqual(1);
    expect(value.year).toBeGreaterThan(1400);
  });

  it('produces factual encouragement rather than religious rulings', () => {
    expect(worshipInsights([definition('fajr')], [], '2026-09-25')[0]).toContain('يتبقى');
  });
});
