import type { ProgressionPath, WorshipDefinition, WorshipLog } from '../types/hierarchical';
import { shiftLocalDateKey, toLocalDateKey } from './date';

export type HijriDate = { day: number; month: number; year: number; label: string };
export function hijriDate(date = new Date()): HijriDate {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { day: value('day'), month: value('month'), year: value('year'), label: new Intl.DateTimeFormat('ar-EG-u-ca-islamic', { dateStyle: 'long' }).format(date) };
}
export const isWhiteDay = (date = new Date()) => [13, 14, 15].includes(hijriDate(date).day);

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
