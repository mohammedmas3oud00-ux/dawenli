import type { AppDataSnapshot } from '../types/hierarchical';
import { emptySnapshot, normalizeSnapshot } from './repository';

export const LEGACY_KEYS = [
  'h_pillars_v2', 'h_visions_v2', 'h_value_goals_v2', 'h_projects_v2', 'h_tasks_v2', 'h_reviews_v2',
  'ppv_inbox_v1', 'ppv_habits_v1', 'ppv_vaults_v1', 'ppv_focus_sessions_v1', 'ppv_time_blocks_v1',
  'dawenli_custom_fields_task', 'dawenli_custom_fields_project', 'dawenli_auth_accounts', 'dawenli_user',
] as const;

const ARRAY_KEYS: Array<[typeof LEGACY_KEYS[number], keyof AppDataSnapshot]> = [
  ['h_pillars_v2', 'pillars'], ['h_visions_v2', 'visions'], ['h_value_goals_v2', 'goals'],
  ['h_projects_v2', 'projects'], ['h_tasks_v2', 'tasks'], ['h_reviews_v2', 'reviews'],
  ['ppv_inbox_v1', 'inboxItems'], ['ppv_habits_v1', 'habits'], ['ppv_vaults_v1', 'vaults'],
  ['ppv_focus_sessions_v1', 'focusSessions'], ['ppv_time_blocks_v1', 'timeBlocks'],
];

export function findLegacySnapshot(): { snapshot: AppDataSnapshot; count: number; isSeedOnly: boolean } | null {
  const snapshot = emptySnapshot();
  let found = false;
  for (const [storageKey, snapshotKey] of ARRAY_KEYS) {
    const raw = localStorage.getItem(storageKey);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        (snapshot as unknown as Record<string, unknown>)[snapshotKey] = parsed;
        found = true;
      }
    } catch {
      // A malformed legacy key is ignored rather than poisoning the whole import.
    }
  }
  if (!found) return null;
  const normalized = normalizeSnapshot(snapshot);
  const count = ARRAY_KEYS.reduce((sum, [, key]) => sum + ((normalized[key] as unknown[])?.length ?? 0), 0);
  const allIds = [normalized.pillars, normalized.visions, normalized.goals, normalized.projects, normalized.tasks]
    .flat().map((item) => item.id);
  const seedPattern = /^(pillar|vis|goal|proj|task)-\d+$/;
  return { snapshot: normalized, count, isSeedOnly: allIds.length > 0 && allIds.every((id) => seedPattern.test(id)) };
}

export function remapSnapshotIds(source: AppDataSnapshot): AppDataSnapshot {
  const snapshot = structuredClone(normalizeSnapshot(source));
  const maps = {
    pillar: new Map<string, string>(), vision: new Map<string, string>(), goal: new Map<string, string>(),
    project: new Map<string, string>(), task: new Map<string, string>(), review: new Map<string, string>(),
    inbox: new Map<string, string>(), habit: new Map<string, string>(), vault: new Map<string, string>(),
    focus: new Map<string, string>(), block: new Map<string, string>(),
  };
  const remap = <T extends { id: string }>(items: T[], map: Map<string, string>) => items.map((item) => {
    const id = crypto.randomUUID();
    map.set(item.id, id);
    return { ...item, id };
  });
  snapshot.pillars = remap(snapshot.pillars, maps.pillar);
  snapshot.visions = remap(snapshot.visions, maps.vision).flatMap((item) => maps.pillar.has(item.pillar_id) ? [{ ...item, pillar_id: maps.pillar.get(item.pillar_id)! }] : []);
  snapshot.goals = remap(snapshot.goals, maps.goal).flatMap((item) => maps.pillar.has(item.pillar_id) ? [{ ...item, pillar_id: maps.pillar.get(item.pillar_id)!, vision_id: item.vision_id ? maps.vision.get(item.vision_id) ?? null : null }] : []);
  snapshot.projects = remap(snapshot.projects, maps.project).flatMap((item) => maps.goal.has(item.goal_id) ? [{ ...item, goal_id: maps.goal.get(item.goal_id)! }] : []);
  snapshot.tasks = remap(snapshot.tasks, maps.task).flatMap((item) => maps.project.has(item.project_id) ? [{ ...item, project_id: maps.project.get(item.project_id)! }] : []);
  snapshot.reviews = remap(snapshot.reviews, maps.review).map((item) => ({ ...item, focus_pillar_id: item.focus_pillar_id ? maps.pillar.get(item.focus_pillar_id) ?? null : null }));
  snapshot.inboxItems = remap(snapshot.inboxItems, maps.inbox).map((item) => ({ ...item, converted_entity_id: null, converted_to: null }));
  snapshot.habits = remap(snapshot.habits, maps.habit).flatMap((item) => maps.pillar.has(item.pillar_id) ? [{ ...item, pillar_id: maps.pillar.get(item.pillar_id)! }] : []);
  snapshot.vaults = remap(snapshot.vaults, maps.vault).flatMap((item) => maps.pillar.has(item.pillar_id) ? [{ ...item, pillar_id: maps.pillar.get(item.pillar_id)!, project_id: item.project_id ? maps.project.get(item.project_id) ?? null : null }] : []);
  snapshot.focusSessions = remap(snapshot.focusSessions, maps.focus).map((item) => ({ ...item, task_id: item.task_id ? maps.task.get(item.task_id) ?? null : null }));
  snapshot.timeBlocks = remap(snapshot.timeBlocks, maps.block).map((item) => ({ ...item, task_id: item.task_id ? maps.task.get(item.task_id) ?? null : null, project_id: item.project_id ? maps.project.get(item.project_id) ?? null : null, pillar_id: item.pillar_id ? maps.pillar.get(item.pillar_id) ?? null : null }));
  snapshot.customFieldDefinitions = snapshot.customFieldDefinitions.map((item) => ({ ...item, id: crypto.randomUUID() }));
  return snapshot;
}

export function removeLegacyDawenliKeys(): void {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
}
