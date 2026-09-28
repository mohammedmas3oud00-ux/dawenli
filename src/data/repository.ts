import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppDataSnapshot,
  CustomFieldDefinition,
  InboxItem,
} from '../types/hierarchical';

export type RepositoryErrorCode = 'not_configured' | 'unauthorized' | 'network' | 'validation' | 'conflict' | 'unknown';

export class RepositoryError extends Error {
  constructor(public readonly code: RepositoryErrorCode, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export interface DataRepository {
  load(): Promise<AppDataSnapshot>;
  save(snapshot: AppDataSnapshot): Promise<void>;
  clear(): Promise<void>;
}

export const emptySnapshot = (): AppDataSnapshot => ({
  schemaVersion: 5,
  pillars: [],
  visions: [],
  goals: [],
  projects: [],
  tasks: [],
  reviews: [],
  inboxItems: [],
  habits: [],
  vaults: [],
  focusSessions: [],
  timeBlocks: [],
  customFieldDefinitions: [],
  worshipDefinitions: [],
  worshipLogs: [],
  progressionPaths: [],
  quranKhatmas: [],
  quranHifzTrackers: [],
  sleepSchedules: [],
  journals: [],
  calendarEvents: [],
});

const GUEST_KEY = 'dawenli_guest_snapshot_v3';
const PENDING_SYNC_PREFIX = 'dawenli_pending_sync_';
const pendingSyncKey = (userId: string) => `${PENDING_SYNC_PREFIX}${userId}`;

export class GuestLocalRepository implements DataRepository {
  async load(): Promise<AppDataSnapshot> {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? normalizeSnapshot(JSON.parse(raw)) : emptySnapshot();
    } catch (error) {
      throw new RepositoryError('validation', 'تعذر قراءة بيانات الضيف المحلية.', error);
    }
  }

  async save(snapshot: AppDataSnapshot): Promise<void> {
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(normalizeSnapshot(snapshot)));
    } catch (error) {
      throw new RepositoryError('unknown', 'تعذر حفظ بيانات الضيف محليًا.', error);
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(GUEST_KEY);
  }
}

const TABLES = [
  ['pillars', 'pillars'],
  ['visions', 'visions'],
  ['value_goals', 'goals'],
  ['projects', 'projects'],
  ['tasks', 'tasks'],
  ['system_reviews', 'reviews'],
  ['inbox_items', 'inboxItems'],
  ['habits', 'habits'],
  ['vault_items', 'vaults'],
  ['focus_sessions', 'focusSessions'],
  ['time_blocks', 'timeBlocks'],
  ['worship_definitions', 'worshipDefinitions'],
  ['worship_logs', 'worshipLogs'],
  ['progression_paths', 'progressionPaths'],
  ['quran_khatmas', 'quranKhatmas'],
  ['quran_hifz_trackers', 'quranHifzTrackers'],
  ['sleep_schedules', 'sleepSchedules'],
  ['journal_entries', 'journals'],
  ['calendar_events', 'calendarEvents'],
] as const;

export class SupabaseRepository implements DataRepository {
  private snapshotRevision: number | null = null;

  constructor(private readonly client: SupabaseClient, private readonly userId: string) {}

  private async readSnapshotRevision(): Promise<number> {
    const { data, error } = await this.client.rpc('dawenli_get_snapshot_revision');
    if (error) throw error;
    const revision = Number(data ?? 0);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new RepositoryError('validation', 'إصدار المزامنة السحابية غير صالح.');
    return revision;
  }

  async load(): Promise<AppDataSnapshot> {
    return this.loadConsistentSnapshot(false);
  }

  private async loadConsistentSnapshot(isRetry: boolean): Promise<AppDataSnapshot> {
    const snapshot = emptySnapshot();
    try {
      const revisionBefore = await this.readSnapshotRevision();
      for (const [table, key] of TABLES) {
        const { data, error } = await this.client.from(table).select('*').eq('user_id', this.userId);
        if (error) throw error;
        (snapshot as unknown as Record<string, unknown>)[key] = (data ?? []).map(fromDatabaseRow);
      }
      const { data, error } = await this.client.from('custom_field_definitions').select('*').eq('user_id', this.userId);
      if (error) throw error;
      snapshot.customFieldDefinitions = (data ?? []).map((row) => ({
        ...fromDatabaseRow(row),
        entityType: row.entity_type,
      })) as CustomFieldDefinition[];
      const revisionAfter = await this.readSnapshotRevision();
      if (revisionBefore !== revisionAfter) {
        if (isRetry) throw new RepositoryError('conflict', 'تغيرت البيانات أثناء التحميل. أعد المحاولة.');
        return this.loadConsistentSnapshot(true);
      }
      this.snapshotRevision = revisionAfter;
      const pendingRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(pendingSyncKey(this.userId)) : null;
      if (pendingRaw) {
        try { return normalizeSnapshot(JSON.parse(pendingRaw)); } catch { localStorage.removeItem(pendingSyncKey(this.userId)); }
      }
      return normalizeSnapshot(snapshot);
    } catch (error) {
      const pendingRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(pendingSyncKey(this.userId)) : null;
      if (pendingRaw) {
        try { return normalizeSnapshot(JSON.parse(pendingRaw)); } catch { localStorage.removeItem(pendingSyncKey(this.userId)); }
      }
      throw mapRepositoryError(error, 'تعذر تحميل بيانات الحساب من Supabase.');
    }
  }

  async save(snapshot: AppDataSnapshot): Promise<void> {
    const normalizedSnapshot = normalizeSnapshot(snapshot);
    try {
      const payload = normalizeSnapshotForDatabase(normalizedSnapshot, this.userId);
      const expectedRevision = this.snapshotRevision ?? await this.readSnapshotRevision();
      const { data, error } = await this.client.rpc('dawenli_save_snapshot', { p_snapshot: payload, p_expected_revision: expectedRevision });
      if (error) throw error;
      const nextRevision = Number(data);
      if (!Number.isSafeInteger(nextRevision) || nextRevision <= expectedRevision) throw new RepositoryError('validation', 'لم يرجع الخادم إصدار مزامنة صالحًا.');
      this.snapshotRevision = nextRevision;
      if (typeof localStorage !== 'undefined') localStorage.removeItem(pendingSyncKey(this.userId));
    } catch (error) {
      const mapped = mapRepositoryError(error, 'تعذرت المزامنة السحابية؛ تم حفظ نسخة محلية مؤقتة وسيُعاد المحاولة تلقائيًا.');
      if (mapped.code !== 'conflict') {
        try {
          if (typeof localStorage !== 'undefined') localStorage.setItem(pendingSyncKey(this.userId), JSON.stringify(normalizedSnapshot));
        } catch { /* Keep the cloud error if browser storage is unavailable. */ }
      }
      throw mapped;
    }
  }

  async clear(): Promise<void> {
    try {
      const { error } = await this.client.rpc('dawenli_clear_snapshot');
      if (error) throw error;
      this.snapshotRevision = await this.readSnapshotRevision();
      if (typeof localStorage !== 'undefined') localStorage.removeItem(pendingSyncKey(this.userId));
    } catch (error) {
      throw mapRepositoryError(error, 'تعذر حذف بيانات الحساب.');
    }
  }

}

export function normalizeSnapshotForDatabase(snapshot: AppDataSnapshot, userId: string): Record<string, unknown> {
  return {
    ...snapshot,
    ...Object.fromEntries(TABLES.map(([table, key]) => [table, (snapshot[key] as unknown as Array<Record<string, unknown>>).map((row) => toDatabaseRow(row, userId, table))])),
    custom_field_definitions: snapshot.customFieldDefinitions.map((definition) => {
      const { entityType, ...rest } = definition;
      return toDatabaseRow({ ...rest, entity_type: entityType }, userId);
    }),
  };
}

function toDatabaseRow(row: Record<string, unknown>, userId: string, table?: string): Record<string, unknown> {
  const now = new Date().toISOString();
  const normalized: Record<string, unknown> = {
    ...row,
    user_id: userId,
    // Older local records were created before updated_at became mandatory.
    updated_at: row.updated_at || now,
  };

  switch (table) {
    case 'projects':
      normalized.status = row.status || 'in_progress';
      normalized.progress = row.progress ?? 0;
      normalized.custom_fields = row.custom_fields ?? {};
      break;
    case 'tasks':
      normalized.status = row.status || 'todo';
      normalized.priority = row.priority || 'medium';
      normalized.custom_fields = row.custom_fields ?? {};
      break;
    case 'habits':
      normalized.frequency = row.frequency || 'daily';
      normalized.target_days_per_week = row.target_days_per_week ?? 7;
      normalized.completed_dates = row.completed_dates ?? [];
      normalized.current_streak = row.current_streak ?? 0;
      normalized.longest_streak = row.longest_streak ?? row.best_streak ?? 0;
      normalized.best_streak = row.best_streak ?? normalized.longest_streak;
      normalized.is_active = row.is_active ?? true;
      normalized.time_of_day = row.time_of_day || 'morning';
      normalized.custom_days = row.custom_days ?? [];
      break;
    case 'inbox_items':
      normalized.source_type = row.source_type || 'idea';
      normalized.status = row.status || 'inbox';
      normalized.converted_to = row.converted_to ?? null;
      normalized.converted_entity_id = row.converted_entity_id ?? null;
      break;
    case 'vault_items':
      normalized.vault_type = row.vault_type || 'notes';
      normalized.status = row.status || 'active';
      break;
    case 'system_reviews':
      normalized.frequency = row.frequency || 'daily';
      normalized.rating = row.rating ?? 8;
      normalized.focus_goal_ids = row.focus_goal_ids ?? [];
      normalized.focus_project_ids = row.focus_project_ids ?? [];
      break;
    case 'worship_definitions':
      normalized.category = row.category || 'custom_dua';
      normalized.tracking_type = row.tracking_type || 'checkbox';
      normalized.frequency = row.frequency || 'daily';
      normalized.is_active = row.is_active ?? true;
      normalized.sort_order = row.sort_order ?? 0;
      break;
    case 'worship_logs':
      normalized.is_completed = row.is_completed ?? false;
      if (normalized.congregation === '') normalized.congregation = null;
      break;
    case 'progression_paths':
      normalized.stages = row.stages ?? [];
      normalized.current_stage_index = row.current_stage_index ?? 0;
      normalized.stage_start_date = row.stage_start_date || String(row.created_at || now).slice(0, 10);
      normalized.consecutive_days = row.consecutive_days ?? 0;
      normalized.auto_promote = row.auto_promote ?? false;
      break;
    case 'quran_khatmas':
      normalized.khatma_number = row.khatma_number ?? 1;
      normalized.start_date = row.start_date || String(row.created_at || now).slice(0, 10);
      normalized.current_page = row.current_page ?? 1;
      normalized.current_juz = row.current_juz ?? 1;
      normalized.daily_target_pages = row.daily_target_pages ?? 2.5;
      normalized.is_completed = row.is_completed ?? false;
      break;
    case 'quran_hifz_trackers':
      normalized.surahs = row.surahs ?? [];
      normalized.total_memorized_pages = row.total_memorized_pages ?? 0;
      normalized.daily_review_pages = row.daily_review_pages ?? 0;
      break;
    case 'sleep_schedules':
      normalized.ultimate_bedtime = row.ultimate_bedtime || '22:00';
      normalized.ultimate_waketime = row.ultimate_waketime || '06:00';
      normalized.current_bedtime = row.current_bedtime || normalized.ultimate_bedtime;
      normalized.current_waketime = row.current_waketime || normalized.ultimate_waketime;
      normalized.adjustment_minutes = row.adjustment_minutes ?? 15;
      normalized.adjustment_frequency_days = row.adjustment_frequency_days ?? 7;
      normalized.is_active = row.is_active ?? true;
      break;
    case 'journal_entries':
      normalized.content = row.content || '';
      normalized.entry_date = row.entry_date || String(row.created_at || now).slice(0, 10);
      normalized.tags = row.tags ?? [];
      normalized.audio_path = row.audio_path ?? null;
      break;
    case 'calendar_events':
      normalized.description = row.description || '';
      normalized.all_day = row.all_day ?? false;
      normalized.timezone = row.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';
      normalized.recurrence = row.recurrence ?? { frequency: 'none', interval: 1 };
      normalized.reminder_minutes = row.reminder_minutes ?? null;
      normalized.is_cancelled = row.is_cancelled ?? false;
      break;
  }

  delete normalized.schemaVersion;
  return normalized;
}

function fromDatabaseRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...row };
  delete normalized.user_id;
  return normalized;
}

function mapRepositoryError(error: unknown, fallback: string): RepositoryError {
  const typed = error as { message?: string; code?: string; details?: string } | null;
  const message = typed?.message || (error instanceof Error ? error.message : fallback);
  const errorCode = String(typed?.code || '').toLowerCase();
  const lower = message.toLowerCase();
  if (errorCode === '42501' || lower.includes('jwt') || lower.includes('auth') || lower.includes('permission')) return new RepositoryError('unauthorized', `${fallback} (${message})`, error);
  if (lower.includes('fetch') || lower.includes('network')) return new RepositoryError('network', fallback, error);
  if (errorCode === '40001' || errorCode === '23505' || errorCode === '23503' || lower.includes('duplicate') || lower.includes('conflict')) return new RepositoryError('conflict', `${fallback} (${message})`, error);
  if (errorCode === '22p02' || errorCode === '23514') return new RepositoryError('validation', `${fallback} (${message})`, error);
  return new RepositoryError('unknown', `${fallback} (${message})`, error);
}

export function normalizeSnapshot(value: Partial<AppDataSnapshot>): AppDataSnapshot {
  const base = emptySnapshot();
  return {
    ...base,
    ...value,
    schemaVersion: 5,
    pillars: Array.isArray(value.pillars) ? value.pillars : [],
    visions: Array.isArray(value.visions) ? value.visions : [],
    goals: Array.isArray(value.goals) ? value.goals : [],
    projects: Array.isArray(value.projects) ? value.projects.map((project) => ({ ...project, custom_fields: project.custom_fields ?? {} })) : [],
    tasks: Array.isArray(value.tasks) ? value.tasks.map((task) => ({ ...task, custom_fields: task.custom_fields ?? {} })) : [],
    reviews: Array.isArray(value.reviews) ? value.reviews.map((review) => ({ ...review, focus_goal_ids: review.focus_goal_ids ?? [], focus_project_ids: review.focus_project_ids ?? [] })) : [],
    inboxItems: Array.isArray(value.inboxItems) ? value.inboxItems.map(normalizeInboxItem) : [],
    habits: Array.isArray(value.habits) ? value.habits.map((habit) => {
      const legacy = habit as unknown as typeof habit & { best_streak?: number };
      const normalized = { ...habit, longest_streak: Math.max(Number(habit.longest_streak ?? 0), Number(legacy.best_streak ?? 0)), custom_days: habit.custom_days ?? [], completed_dates: habit.completed_dates ?? [] };
      delete (normalized as unknown as { best_streak?: number }).best_streak;
      return normalized;
    }) : [],
    vaults: Array.isArray(value.vaults) ? value.vaults.map((item) => ({ ...item, status: item.status || 'active' })) : [],
    focusSessions: Array.isArray(value.focusSessions) ? value.focusSessions : [],
    timeBlocks: Array.isArray(value.timeBlocks) ? value.timeBlocks : [],
    customFieldDefinitions: Array.isArray(value.customFieldDefinitions) ? value.customFieldDefinitions : [],
    worshipDefinitions: Array.isArray(value.worshipDefinitions) ? value.worshipDefinitions.map((definition) => ({ ...definition, frequency: definition.frequency ?? 'daily', scheduled_days: definition.scheduled_days ?? [], scheduled_hijri_days: definition.scheduled_hijri_days ?? [], settings_history: definition.settings_history ?? [], is_active: definition.is_active ?? true, sort_order: definition.sort_order ?? 0 })) : [],
    worshipLogs: Array.isArray(value.worshipLogs) ? value.worshipLogs.map((log) => ({ ...log, is_completed: log.is_completed ?? false, congregation: (log.congregation as unknown) === '' ? null : log.congregation })) : [],
    progressionPaths: Array.isArray(value.progressionPaths) ? value.progressionPaths.map((path) => ({ ...path, stages: path.stages ?? [], current_stage_index: path.current_stage_index ?? 0, consecutive_days: path.consecutive_days ?? 0, auto_promote: path.auto_promote ?? false })) : [],
    quranKhatmas: Array.isArray(value.quranKhatmas) ? value.quranKhatmas.map((khatma) => ({ ...khatma, daily_target_pages: khatma.daily_target_pages ?? 2.5, is_completed: khatma.is_completed ?? false })) : [],
    quranHifzTrackers: Array.isArray(value.quranHifzTrackers) ? value.quranHifzTrackers.map((tracker) => ({ ...tracker, surahs: tracker.surahs ?? [], total_memorized_pages: tracker.total_memorized_pages ?? 0, daily_review_pages: tracker.daily_review_pages ?? 0 })) : [],
    sleepSchedules: Array.isArray(value.sleepSchedules) ? value.sleepSchedules.map((schedule) => ({ ...schedule, adjustment_minutes: schedule.adjustment_minutes ?? 15, adjustment_frequency_days: schedule.adjustment_frequency_days ?? 7, is_active: schedule.is_active ?? true })) : [],
    journals: Array.isArray(value.journals) ? value.journals.map((entry) => ({ ...entry, content: entry.content || '', entry_date: entry.entry_date || String(entry.created_at || new Date().toISOString()).slice(0, 10), tags: entry.tags ?? [], audio_path: entry.audio_path ?? null })) : [],
    calendarEvents: Array.isArray(value.calendarEvents) ? value.calendarEvents.map((event) => ({ ...event, description: event.description || '', all_day: event.all_day ?? false, timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo', recurrence: event.recurrence ?? { frequency: 'none', interval: 1 }, reminder_minutes: event.reminder_minutes ?? null, is_cancelled: event.is_cancelled ?? false })) : [],
  };
}

function normalizeInboxItem(item: InboxItem): InboxItem {
  const legacy = (item as unknown as { processed_into?: { entity_type: InboxItem['converted_to']; entity_id: string } }).processed_into;
  const normalized = {
    ...item,
    converted_to: item.converted_to ?? legacy?.entity_type ?? null,
    converted_entity_id: item.converted_entity_id ?? legacy?.entity_id ?? null,
  };
  delete (normalized as unknown as { processed_into?: unknown }).processed_into;
  return normalized;
}

export function createSnapshotBackup(snapshot: AppDataSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `dawenli-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
