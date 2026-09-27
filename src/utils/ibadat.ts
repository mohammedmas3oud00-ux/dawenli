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
  // The empty UI option means "not specified". PostgreSQL's nullable check
  // constraint accepts null, but not the empty string.
  const normalizedPatch = patch.congregation === ('' as unknown as WorshipLog['congregation'])
    ? { ...patch, congregation: null }
    : patch;
  return {
    ...prior, ...normalizedPatch,
    id: prior?.id || crypto.randomUUID(), worship_id: definition.id, date,
    created_at: prior?.created_at || now, is_completed: completed,
    completed_at: completed ? (prior?.is_completed && prior.completed_at ? prior.completed_at : now) : null,
  };
}

export function worshipDefinitionAt(item: WorshipDefinition, date: string): WorshipDefinition {
  const settings = [...(item.settings_history ?? [])].sort((a, b) => b.effective_date.localeCompare(a.effective_date)).find((entry) => entry.effective_date <= date);
  return settings ? { ...item, ...settings } : item;
}

/** Keep historical targets/schedules intact; changes apply from the selected local day. */
export function changeWorshipSettings(item: WorshipDefinition, patch: Partial<WorshipDefinition>, today = toLocalDateKey()): WorshipDefinition {
  const snapshot = (value: WorshipDefinition, effective_date: string) => ({
    effective_date, frequency: value.frequency,
    scheduled_days: value.scheduled_days ?? (value.category === 'fasting' ? [1, 4] : []),
    scheduled_hijri_days: value.scheduled_hijri_days ?? [],
    target_count: value.target_count ?? null, target_pages: value.target_pages ?? null, is_active: value.is_active,
  });
  const history = item.settings_history?.length ? item.settings_history : [snapshot(item, toLocalDateKey(new Date(item.created_at)))];
  const changed = { ...item, ...patch, updated_at: new Date().toISOString() };
  return { ...changed, settings_history: [...history.filter((entry) => entry.effective_date < today), snapshot(changed, today)] };
}

export function isWorshipScheduled(definition: WorshipDefinition, date = toLocalDateKey()): boolean {
  const item = worshipDefinitionAt(definition, date);
  if (!item.is_active || date < toLocalDateKey(new Date(item.created_at))) return false;
  const local = parseLocalDateKey(date);
  if (item.category === 'fasting') {
    // Existing fasting records default to the requested Monday/Thursday plan.
    const weekdays = item.scheduled_days ?? [1, 4];
    return weekdays.includes(local.getDay()) || (item.scheduled_hijri_days ?? []).includes(hijriDate(local).day);
  }
  if (item.frequency === 'daily') return true;
  return (item.scheduled_days ?? []).includes(local.getDay());
}

export function isWorshipComplete(definition: WorshipDefinition, log: WorshipLog | undefined): boolean {
  if (!log?.is_completed) return false;
  const item = worshipDefinitionAt(definition, log.date);
  if (item.tracking_type === 'pages') {
    const minimumPages = item.category === 'quran_wird' ? 5 : 1;
    return (log.pages_read ?? 0) >= Math.max(minimumPages, item.target_pages || minimumPages);
  }
  if (item.category === 'qiyam') return (log.rakaat_count ?? 0) >= (item.target_count || 2);
  if (item.tracking_type === 'counter') return (log.count ?? 0) >= (item.target_count || 1);
  return true;
}

export function worshipSummary(definitions: WorshipDefinition[], logs: WorshipLog[], date = toLocalDateKey()) {
  const active = definitions.filter((item) => isWorshipScheduled(item, date));
  const completed = active.filter((item) => isWorshipComplete(item, logs.find((log) => log.worship_id === item.id && log.date === date))).length;
  return { total: active.length, completed, rate: active.length ? Math.round((completed / active.length) * 100) : 0 };
}

export function worshipStreak(definitions: WorshipDefinition[], logs: WorshipLog[], today = toLocalDateKey()) {
  let days = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const key = shiftLocalDateKey(today, -offset);
    const summary = worshipSummary(definitions, logs, key);
    if (!summary.total) continue;
    // Today is still in progress; it must not erase yesterday's streak.
    if (offset === 0 && summary.completed !== summary.total) continue;
    if (summary.completed !== summary.total) break;
    days += 1;
  }
  return days;
}

export function progressionCompleted(path: ProgressionPath, logs: WorshipLog[], today = toLocalDateKey()): number {
  const stage = path.stages[path.current_stage_index];
  if (!stage) return 0;
  return new Set(logs.filter((log) => log.worship_id === path.worship_id && log.is_completed && log.date >= path.stage_start_date && log.date <= today &&
    (log.pages_read == null || log.pages_read >= stage.target_value) &&
    (log.rakaat_count == null || log.rakaat_count >= stage.target_value)).map((log) => log.date)).size;
}

export function progressionSuggestion(path: ProgressionPath, logs: WorshipLog[]): string | null {
  const stage = path.stages[path.current_stage_index];
  const next = path.stages[path.current_stage_index + 1];
  if (!stage || !next || progressionCompleted(path, logs) < stage.days_required) return null;
  return `أكملت مرحلة «${stage.title}». هل تريد الانتقال إلى «${next.title}»؟`;
}

/** Consecutive scheduled days at the currently configured target; today may be unfinished. */
export function targetStreak(definition: WorshipDefinition, logs: WorshipLog[], start: string, today = toLocalDateKey()): number {
  let days = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const date = shiftLocalDateKey(today, -offset);
    if (date < start) break;
    if (!isWorshipScheduled(definition, date)) continue;
    const complete = isWorshipComplete(definition, logs.find((log) => log.worship_id === definition.id && log.date === date));
    if (!complete && offset === 0) continue;
    if (!complete) break;
    days += 1;
  }
  return days;
}

export function configuredProgression(path: ProgressionPath, definition: WorshipDefinition): ProgressionPath {
  if (!['quran_wird', 'qiyam'].includes(definition.category)) return path;
  const quran = definition.category === 'quran_wird';
  const target = quran ? Math.max(5, definition.target_pages || 5) : definition.target_count || 2;
  const duration = definition.progression_days || 30;
  const label = (value: number) => quran ? `${value / 5} أرباع جزء يوميًا` : `${value} ركعات`;
  const increment = quran ? 5 : 2;
  const stages = [...path.stages];
  stages[path.current_stage_index] = { index: path.current_stage_index, title: label(target), description: `استمرار ${duration} يومًا مقررًا قبل اقتراح الزيادة`, target_value: target, days_required: duration };
  stages[path.current_stage_index + 1] = { index: path.current_stage_index + 1, title: label(target + increment), description: 'زيادة اختيارية فقط', target_value: target + increment, days_required: duration };
  return { ...path, stages };
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
