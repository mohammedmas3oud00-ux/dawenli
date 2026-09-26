import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppDataSnapshot,
  CustomFieldDefinition,
  FocusSessionRecord,
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
  schemaVersion: 4,
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
});

const GUEST_KEY = 'dawenli_guest_snapshot_v3';

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
] as const;

export class SupabaseRepository implements DataRepository {
  constructor(private readonly client: SupabaseClient, private readonly userId: string) {}

  async load(): Promise<AppDataSnapshot> {
    const snapshot = emptySnapshot();
    try {
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
      return normalizeSnapshot(snapshot);
    } catch (error) {
      throw mapRepositoryError(error, 'تعذر تحميل بيانات الحساب من Supabase.');
    }
  }

  async save(snapshot: AppDataSnapshot): Promise<void> {
    try {
      const payload = {
        ...snapshot,
        ...Object.fromEntries(TABLES.map(([table, key]) => [table, (snapshot[key] as unknown as Array<Record<string, unknown>>).map((row) => toDatabaseRow(row, this.userId))])),
        custom_field_definitions: snapshot.customFieldDefinitions.map((definition) => {
          const { entityType, ...rest } = definition;
          return toDatabaseRow({ ...rest, entity_type: entityType }, this.userId);
        }),
      };
      const { error } = await this.client.rpc('dawenli_save_snapshot', { p_snapshot: payload });
      if (error) throw error;
    } catch (error) {
      throw mapRepositoryError(error, 'فشلت المزامنة. لم يُسجّل نجاح محلي بديل.');
    }
  }

  async clear(): Promise<void> {
    try {
      const { error } = await this.client.rpc('dawenli_clear_snapshot');
      if (error) throw error;
    } catch (error) {
      throw mapRepositoryError(error, 'تعذر حذف بيانات الحساب.');
    }
  }

}

function toDatabaseRow(row: Record<string, unknown>, userId: string): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...row,
    user_id: userId,
    // Older local records were created before updated_at became mandatory.
    // Supplying it here keeps the atomic RPC compatible with those records.
    updated_at: row.updated_at || new Date().toISOString(),
  };
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
  if (errorCode === '23505' || errorCode === '23503' || lower.includes('duplicate') || lower.includes('conflict')) return new RepositoryError('conflict', `${fallback} (${message})`, error);
  if (errorCode === '22p02' || errorCode === '23514') return new RepositoryError('validation', `${fallback} (${message})`, error);
  return new RepositoryError('unknown', `${fallback} (${message})`, error);
}

export function normalizeSnapshot(value: Partial<AppDataSnapshot>): AppDataSnapshot {
  const base = emptySnapshot();
  return {
    ...base,
    ...value,
    schemaVersion: 4,
    pillars: Array.isArray(value.pillars) ? value.pillars : [],
    visions: Array.isArray(value.visions) ? value.visions : [],
    goals: Array.isArray(value.goals) ? value.goals : [],
    projects: Array.isArray(value.projects) ? value.projects : [],
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    reviews: Array.isArray(value.reviews) ? value.reviews : [],
    inboxItems: Array.isArray(value.inboxItems) ? value.inboxItems.map(normalizeInboxItem) : [],
    habits: Array.isArray(value.habits) ? value.habits.map((habit) => {
      const legacy = habit as unknown as typeof habit & { best_streak?: number };
      const normalized = { ...habit, longest_streak: habit.longest_streak ?? Number(legacy.best_streak ?? 0) };
      delete (normalized as unknown as { best_streak?: number }).best_streak;
      return normalized;
    }) : [],
    vaults: Array.isArray(value.vaults) ? value.vaults : [],
    focusSessions: Array.isArray(value.focusSessions) ? value.focusSessions : [],
    timeBlocks: Array.isArray(value.timeBlocks) ? value.timeBlocks : [],
    customFieldDefinitions: Array.isArray(value.customFieldDefinitions) ? value.customFieldDefinitions : [],
    worshipDefinitions: Array.isArray(value.worshipDefinitions) ? value.worshipDefinitions : [],
    worshipLogs: Array.isArray(value.worshipLogs) ? value.worshipLogs : [],
    progressionPaths: Array.isArray(value.progressionPaths) ? value.progressionPaths : [],
    quranKhatmas: Array.isArray(value.quranKhatmas) ? value.quranKhatmas : [],
    quranHifzTrackers: Array.isArray(value.quranHifzTrackers) ? value.quranHifzTrackers : [],
    sleepSchedules: Array.isArray(value.sleepSchedules) ? value.sleepSchedules : [],
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
