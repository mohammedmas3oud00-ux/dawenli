import type { ProgressionPath, WorshipDefinition, WorshipLog } from '../types/hierarchical';
import { parseLocalDateKey, shiftLocalDateKey, toLocalDateKey } from './date';

export type HijriDate = { day: number; month: number; year: number; label: string };
export function hijriDate(date = new Date()): HijriDate {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { day: value('day'), month: value('month'), year: value('year'), label: new Intl.DateTimeFormat('ar-EG-u-ca-islamic', { dateStyle: 'long' }).format(date) };
}
export const isWhiteDay = (date = new Date()) => [13, 14, 15].includes(hijriDate(date).day);

export const isEditableWorshipDate = (date: string, today = toLocalDateKey()) => {
  try {
    parseLocalDateKey(date);
    parseLocalDateKey(today);
    // Calendar keys, not elapsed hours: DST days can contain 23 or 25 hours.
    return date <= today && date >= shiftLocalDateKey(today, -30);
  } catch { return false; }
};

export function updateWorshipLog(definition: WorshipDefinition, date: string, prior: WorshipLog | undefined, patch: Partial<WorshipLog>, now = new Date().toISOString()): WorshipLog {
  const completed = patch.is_completed ?? prior?.is_completed ?? false;
  return {
    ...prior, ...patch,
    id: prior?.id || crypto.randomUUID(), worship_id: definition.id, date,
    created_at: prior?.created_at || now, is_completed: completed,
    completed_at: completed ? (prior?.is_completed && prior.completed_at ? prior.completed_at : now) : null,
  };
}

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

/** Safe, deterministic insights. Gemini may summarize these facts but never supplies religious rulings. */
export function worshipInsights(definitions: WorshipDefinition[], logs: WorshipLog[], today = toLocalDateKey()): string[] {
  const todaySummary = worshipSummary(definitions, logs, today);
  const insights: string[] = [];
  if (!todaySummary.total) return ['فعّل ما يناسبك من العبادات لبدء المتابعة.'];
  if (todaySummary.completed === todaySummary.total) insights.push('أتممت عباداتك المفعلة اليوم — بارك الله في ثباتك.');
  else insights.push(`يتبقى ${todaySummary.total - todaySummary.completed} من العبادات المفعلة اليوم.`);
  const evening = definitions.find((item) => item.category === 'adhkar' && item.time_of_day === 'evening');
  const missedEvenings = evening ? [1, 2, 3].filter((offset) => !logs.some((log) => log.worship_id === evening.id && log.date === shiftLocalDateKey(today, -offset) && log.is_completed)).length : 0;
  if (missedEvenings >= 2) insights.push('لاحظنا تكرار تفويت أذكار المساء؛ يمكنك تفعيل تذكير هادئ لها.');
  return insights;
}
