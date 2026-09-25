import type { ProgressionPath, WorshipDefinition, WorshipLog } from '../types/hierarchical';
import { toLocalDateKey } from './date';
import { shiftLocalDateKey } from './date';

export const isEditableWorshipDate = (date: string, today = toLocalDateKey()) => {
  const delta = Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000);
  return delta >= 0 && delta <= 30;
};

export function worshipSummary(definitions: WorshipDefinition[], logs: WorshipLog[], date = toLocalDateKey()) {
  const active = definitions.filter((item) => item.is_active && item.frequency === 'daily');
  const completed = active.filter((item) => logs.some((log) => log.worship_id === item.id && log.date === date && log.is_completed)).length;
  return { total: active.length, completed, rate: active.length ? Math.round((completed / active.length) * 100) : 0 };
}

export function worshipStreak(definitions: WorshipDefinition[], logs: WorshipLog[], today = toLocalDateKey()) {
  let days = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const key = shiftLocalDateKey(today, -offset);
    const summary = worshipSummary(definitions, logs, key);
    if (!summary.total || summary.completed !== summary.total) break;
    days += 1;
  }
  return days;
}

export function progressionSuggestion(path: ProgressionPath, logs: WorshipLog[]): string | null {
  const stage = path.stages[path.current_stage_index];
  const next = path.stages[path.current_stage_index + 1];
  if (!stage || !next || path.consecutive_days < stage.days_required) return null;
  return `أكملت مرحلة «${stage.title}». هل تريد الانتقال إلى «${next.title}»؟`;
}
