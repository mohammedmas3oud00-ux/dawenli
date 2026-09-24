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
  schemaVersion: 3,
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
      for (const [table, key] of TABLES) {
        const rows = (snapshot[key] as unknown as Array<Record<string, unknown>>).map((row) => toDatabaseRow(row, this.userId));
        await this.replaceTable(table, rows);
      }
      const definitions = snapshot.customFieldDefinitions.map((definition) => {
        const { entityType, ...rest } = definition;
        return toDatabaseRow({ ...rest, entity_type: entityType }, this.userId);
      });
      await this.replaceTable('custom_field_definitions', definitions);
    } catch (error) {
      throw mapRepositoryError(error, 'فشلت المزامنة. لم يُسجّل نجاح محلي بديل.');
    }
  }

  async clear(): Promise<void> {
    try {
      for (const [table] of [...TABLES].reverse()) {
        const { error } = await this.client.from(table).delete().eq('user_id', this.userId);
        if (error) throw error;
      }
      const { error } = await this.client.from('custom_field_definitions').delete().eq('user_id', this.userId);
      if (error) throw error;
    } catch (error) {
      throw mapRepositoryError(error, 'تعذر حذف بيانات الحساب.');
    }
  }

  private async replaceTable(table: string, rows: Array<Record<string, unknown>>): Promise<void> {
    const { data: existing, error: readError } = await this.client.from(table).select('id').eq('user_id', this.userId);
    if (readError) throw readError;
    const currentIds = new Set(rows.map((row) => String(row.id)));
    const removedIds = (existing ?? []).map((row) => String(row.id)).filter((id) => !currentIds.has(id));
    if (removedIds.length) {
      const { error } = await this.client.from(table).delete().eq('user_id', this.userId).in('id', removedIds);
      if (error) throw error;
    }
    if (rows.length) {
      const { error } = await this.client.from(table).upsert(rows, { onConflict: 'id,user_id' });
      if (error) throw error;
    }
  }
}

function toDatabaseRow(row: Record<string, unknown>, userId: string): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...row, user_id: userId };
  delete normalized.schemaVersion;
  return normalized;
}

function fromDatabaseRow(row: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...row };
  delete normalized.user_id;
  return normalized;
}

function mapRepositoryError(error: unknown, fallback: string): RepositoryError {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();
  if (lower.includes('jwt') || lower.includes('auth') || lower.includes('permission')) return new RepositoryError('unauthorized', fallback, error);
  if (lower.includes('fetch') || lower.includes('network')) return new RepositoryError('network', fallback, error);
  if (lower.includes('duplicate') || lower.includes('conflict')) return new RepositoryError('conflict', fallback, error);
  return new RepositoryError('unknown', fallback, error);
}

export function normalizeSnapshot(value: Partial<AppDataSnapshot>): AppDataSnapshot {
  const base = emptySnapshot();
  return {
    ...base,
    ...value,
    schemaVersion: 3,
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
