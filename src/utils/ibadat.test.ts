import { describe, expect, it } from 'vitest';
import type { WorshipDefinition, WorshipLog } from '../types/hierarchical';
import { isEditableWorshipDate, progressionSuggestion, worshipStreak, worshipSummary } from './ibadat';

const definition = (id: string): WorshipDefinition => ({ id, pillar_id: 'pillar', title: id, category: 'salah', tracking_type: 'multi_option', frequency: 'daily', is_active: true, sort_order: 0, created_at: '2026-09-01T00:00:00Z' });
const log = (worship_id: string, date: string): WorshipLog => ({ id: `${worship_id}-${date}`, worship_id, date, is_completed: true, created_at: `${date}T00:00:00Z` });

describe('ibadat calculations', () => {
  it('accepts today and the previous thirty days only', () => {
    expect(isEditableWorshipDate('2026-09-25', '2026-09-25')).toBe(true);
    expect(isEditableWorshipDate('2026-08-26', '2026-09-25')).toBe(true);
    expect(isEditableWorshipDate('2026-08-25', '2026-09-25')).toBe(false);
    expect(isEditableWorshipDate('2026-09-26', '2026-09-25')).toBe(false);
  });

  it('calculates completion and streak only when all enabled daily worships are complete', () => {
    const definitions = [definition('fajr'), definition('dhuhr')];
    const logs = [log('fajr', '2026-09-25'), log('dhuhr', '2026-09-25'), log('fajr', '2026-09-24'), log('dhuhr', '2026-09-24')];
    expect(worshipSummary(definitions, logs, '2026-09-25')).toMatchObject({ completed: 2, total: 2, rate: 100 });
    expect(worshipStreak(definitions, logs, '2026-09-25')).toBe(2);
  });

  it('suggests, rather than auto-promotes, a completed progression stage', () => {
    const path = { id: 'path', worship_id: 'qiyam', title: 'قيام', stages: [{ index: 0, title: 'البداية', description: '', target_value: 2, days_required: 7 }, { index: 1, title: 'التالي', description: '', target_value: 4, days_required: 7 }], current_stage_index: 0, stage_start_date: '2026-09-01', consecutive_days: 7, auto_promote: false, created_at: '2026-09-01' };
    expect(progressionSuggestion(path, [])).toContain('هل تريد');
  });
});
