import { describe, expect, it } from 'vitest';
import { recalculateAllHierarchicalProgress } from './hierarchicalStore';

describe('hierarchical rollup', () => {
  it('reopens completed parents and includes direct goals in pillar progress', () => {
    const now = new Date().toISOString();
    const result = recalculateAllHierarchicalProgress(
      [{ id: 'p', title: 'p', description: '', pillar_group: 'Growth', purpose: '', priority: 1, show_on_home: true, status: 'active', progress: 100, created_at: now }],
      [{ id: 'v', pillar_id: 'p', title: 'v', description: '', status: 'active', progress: 100, created_at: now }],
      [
        { id: 'g1', pillar_id: 'p', vision_id: 'v', title: 'g1', description: '', status: 'completed', target_date: null, progress: 100, created_at: now },
        { id: 'g2', pillar_id: 'p', vision_id: null, title: 'g2', description: '', status: 'completed', target_date: null, progress: 100, created_at: now },
      ],
      [
        { id: 'pr1', goal_id: 'g1', title: 'pr1', description: '', status: 'completed', progress: 100, start_date: '2026-01-01', due_date: null, created_at: now },
        { id: 'pr2', goal_id: 'g2', title: 'pr2', description: '', status: 'completed', progress: 100, start_date: '2026-01-01', due_date: null, created_at: now },
      ],
      [
        { id: 't1', project_id: 'pr1', title: 't1', description: '', status: 'todo', priority: 'high', due_date: null, completed_at: null, created_at: now },
        { id: 't2', project_id: 'pr2', title: 't2', description: '', status: 'done', priority: 'high', due_date: null, completed_at: now, created_at: now },
      ],
    );
    expect(result.projects[0].status).toBe('planned');
    expect(result.goals[0].status).toBe('not_started');
    expect(result.pillars[0].progress).toBe(50);
  });
});
