import { describe, expect, it } from 'vitest';
import { emptySnapshot } from './repository';
import { remapSnapshotIds } from './legacyMigration';

describe('legacy migration', () => {
  it('creates UUIDs and repairs parent relations', () => {
    const now = new Date().toISOString();
    const snapshot = emptySnapshot();
    snapshot.pillars.push({ id: 'pillar-1', title: 'p', description: '', pillar_group: 'Growth', purpose: '', priority: 1, show_on_home: true, status: 'active', progress: 0, created_at: now });
    snapshot.goals.push({ id: 'goal-1', pillar_id: 'pillar-1', vision_id: null, title: 'g', description: '', status: 'not_started', target_date: null, progress: 0, created_at: now });
    snapshot.projects.push({ id: 'proj-1', goal_id: 'goal-1', title: 'pr', description: '', status: 'planned', progress: 0, start_date: '2026-01-01', due_date: null, created_at: now });
    const migrated = remapSnapshotIds(snapshot);
    expect(migrated.pillars[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(migrated.goals[0].pillar_id).toBe(migrated.pillars[0].id);
    expect(migrated.projects[0].goal_id).toBe(migrated.goals[0].id);
  });
});
