import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emptySnapshot } from './repository';
import { findLegacySnapshot, LEGACY_KEYS, remapSnapshotIds, removeLegacyDawenliKeys } from './legacyMigration';

describe('legacy migration', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('creates UUIDs and repairs parent relations', () => {
    const now = new Date().toISOString();
    const snapshot = emptySnapshot();
    snapshot.pillars.push({
      id: 'pillar-1',
      title: 'p',
      description: '',
      pillar_group: 'Growth',
      purpose: '',
      priority: 1,
      show_on_home: true,
      status: 'active',
      progress: 0,
      created_at: now,
    });
    snapshot.goals.push({
      id: 'goal-1',
      pillar_id: 'pillar-1',
      vision_id: null,
      title: 'g',
      description: '',
      status: 'not_started',
      target_date: null,
      progress: 0,
      created_at: now,
    });
    snapshot.projects.push({
      id: 'proj-1',
      goal_id: 'goal-1',
      title: 'pr',
      description: '',
      status: 'planned',
      progress: 0,
      start_date: '2026-01-01',
      due_date: null,
      created_at: now,
    });
    const migrated = remapSnapshotIds(snapshot);
    expect(migrated.pillars[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(migrated.goals[0].pillar_id).toBe(migrated.pillars[0].id);
    expect(migrated.projects[0].goal_id).toBe(migrated.goals[0].id);
  });

  it('drops orphaned children whose parents are absent', () => {
    const snapshot = emptySnapshot();
    snapshot.tasks.push({
      id: 'task-1',
      project_id: 'missing-project',
      title: 't',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: null,
      completed_at: null,
      created_at: new Date().toISOString(),
    });
    const migrated = remapSnapshotIds(snapshot);
    expect(migrated.tasks).toEqual([]);
  });

  it('relinks nested descendants through the new id maps', () => {
    const now = new Date().toISOString();
    const snapshot = emptySnapshot();
    snapshot.pillars.push({
      id: 'pillar-1',
      title: 'p',
      description: '',
      pillar_group: 'Growth',
      purpose: '',
      priority: 1,
      show_on_home: true,
      status: 'active',
      progress: 0,
      created_at: now,
    });
    snapshot.visions.push({
      id: 'vision-1',
      pillar_id: 'pillar-1',
      title: 'v',
      description: '',
      status: 'active',
      progress: 0,
      created_at: now,
    });
    snapshot.goals.push({
      id: 'goal-1',
      pillar_id: 'pillar-1',
      vision_id: 'vision-1',
      title: 'g',
      description: '',
      status: 'not_started',
      target_date: null,
      progress: 0,
      created_at: now,
    });
    snapshot.habits.push({
      id: 'habit-1',
      pillar_id: 'pillar-1',
      title: 'h',
      description: '',
      frequency: 'daily',
      target_days_per_week: 7,
      time_of_day: 'morning',
      current_streak: 0,
      longest_streak: 0,
      completed_dates: [],
      is_active: true,
      created_at: now,
    } as never);
    const migrated = remapSnapshotIds(snapshot);
    expect(migrated.visions[0].pillar_id).toBe(migrated.pillars[0].id);
    expect(migrated.goals[0].vision_id).toBe(migrated.visions[0].id);
    expect(migrated.habits[0].pillar_id).toBe(migrated.pillars[0].id);
  });

  it('clears conversion and audio links during remapping', () => {
    const snapshot = emptySnapshot();
    snapshot.inboxItems.push({
      id: 'inbox-1',
      title: 'i',
      converted_to: 'task',
      converted_entity_id: 'task-1',
    } as never);
    snapshot.journals.push({
      id: 'journal-1',
      title: 'j',
      content: '',
      entry_date: '2026-01-01',
      tags: [],
      audio_path: '/audio/old.mp3',
      pillar_id: 'missing',
      project_id: 'missing',
      created_at: new Date().toISOString(),
    } as never);
    const migrated = remapSnapshotIds(snapshot);
    expect(migrated.inboxItems[0].converted_to).toBeNull();
    expect(migrated.inboxItems[0].converted_entity_id).toBeNull();
    expect(migrated.journals[0].audio_path).toBeNull();
  });

  it('detects seed-only and user legacy snapshots', () => {
    expect(findLegacySnapshot()).toBeNull();

    localStorage.setItem('h_pillars_v2', JSON.stringify([{ id: 'pillar-1', title: 'p' }]));
    const seedOnly = findLegacySnapshot();
    expect(seedOnly?.isSeedOnly).toBe(true);
    expect(seedOnly?.count).toBeGreaterThan(0);

    localStorage.setItem('h_tasks_v2', JSON.stringify([{ id: 'custom-task', title: 't' }]));
    expect(findLegacySnapshot()?.isSeedOnly).toBe(false);
  });

  it('ignores malformed legacy keys', () => {
    localStorage.setItem('h_pillars_v2', '{broken');
    localStorage.setItem('ppv_inbox_v1', 'not-an-array');
    expect(findLegacySnapshot()).toBeNull();
  });

  it('removes every legacy storage key', () => {
    for (const key of LEGACY_KEYS) localStorage.setItem(key, '1');
    removeLegacyDawenliKeys();
    for (const key of LEGACY_KEYS) expect(localStorage.getItem(key)).toBeNull();
  });
});
