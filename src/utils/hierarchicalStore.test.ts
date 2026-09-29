import { describe, expect, it } from 'vitest';
import { recalculateAllHierarchicalProgress } from './hierarchicalStore';

describe('hierarchical rollup', () => {
  it('reopens completed parents and includes direct goals in pillar progress', () => {
    const now = new Date().toISOString();
    const result = recalculateAllHierarchicalProgress(
      [
        {
          id: 'p',
          title: 'p',
          description: '',
          pillar_group: 'Growth',
          purpose: '',
          priority: 1,
          show_on_home: true,
          status: 'active',
          progress: 100,
          created_at: now,
        },
      ],
      [{ id: 'v', pillar_id: 'p', title: 'v', description: '', status: 'active', progress: 100, created_at: now }],
      [
        {
          id: 'g1',
          pillar_id: 'p',
          vision_id: 'v',
          title: 'g1',
          description: '',
          status: 'completed',
          target_date: null,
          progress: 100,
          created_at: now,
        },
        {
          id: 'g2',
          pillar_id: 'p',
          vision_id: null,
          title: 'g2',
          description: '',
          status: 'completed',
          target_date: null,
          progress: 100,
          created_at: now,
        },
      ],
      [
        {
          id: 'pr1',
          goal_id: 'g1',
          title: 'pr1',
          description: '',
          status: 'completed',
          progress: 100,
          start_date: '2026-01-01',
          due_date: null,
          created_at: now,
        },
        {
          id: 'pr2',
          goal_id: 'g2',
          title: 'pr2',
          description: '',
          status: 'completed',
          progress: 100,
          start_date: '2026-01-01',
          due_date: null,
          created_at: now,
        },
      ],
      [
        {
          id: 't1',
          project_id: 'pr1',
          title: 't1',
          description: '',
          status: 'todo',
          priority: 'high',
          due_date: null,
          completed_at: null,
          created_at: now,
        },
        {
          id: 't2',
          project_id: 'pr2',
          title: 't2',
          description: '',
          status: 'done',
          priority: 'high',
          due_date: null,
          completed_at: now,
          created_at: now,
        },
      ],
    );
    expect(result.projects[0].status).toBe('planned');
    expect(result.goals[0].status).toBe('not_started');
    expect(result.pillars[0].progress).toBe(50);
  });

  it('averages task completion into project and goal progress', () => {
    const now = new Date().toISOString();
    const result = recalculateAllHierarchicalProgress(
      [],
      [],
      [
        {
          id: 'g',
          pillar_id: 'p',
          vision_id: null,
          title: 'g',
          description: '',
          status: 'not_started',
          target_date: null,
          progress: 0,
          created_at: now,
        },
      ],
      [
        {
          id: 'pr',
          goal_id: 'g',
          title: 'pr',
          description: '',
          status: 'in_progress',
          progress: 0,
          start_date: '2026-01-01',
          due_date: null,
          created_at: now,
        },
      ],
      [
        {
          id: 't1',
          project_id: 'pr',
          title: 't1',
          description: '',
          status: 'done',
          priority: 'medium',
          due_date: null,
          completed_at: now,
          created_at: now,
        },
        {
          id: 't2',
          project_id: 'pr',
          title: 't2',
          description: '',
          status: 'todo',
          priority: 'medium',
          due_date: null,
          completed_at: null,
          created_at: now,
        },
        {
          id: 't3',
          project_id: 'other',
          title: 't3',
          description: '',
          status: 'done',
          priority: 'medium',
          due_date: null,
          completed_at: now,
          created_at: now,
        },
      ],
    );
    expect(result.projects[0].progress).toBe(50);
    expect(result.projects[0].status).toBe('in_progress');
    expect(result.goals[0].progress).toBe(50);
    expect(result.goals[0].status).toBe('in_progress');
  });

  it('marks parents completed at full progress', () => {
    const now = new Date().toISOString();
    const result = recalculateAllHierarchicalProgress(
      [],
      [{ id: 'v', pillar_id: 'p', title: 'v', description: '', status: 'active', progress: 0, created_at: now }],
      [
        {
          id: 'g',
          pillar_id: 'p',
          vision_id: 'v',
          title: 'g',
          description: '',
          status: 'not_started',
          target_date: null,
          progress: 0,
          created_at: now,
        },
      ],
      [
        {
          id: 'pr',
          goal_id: 'g',
          title: 'pr',
          description: '',
          status: 'planned',
          progress: 0,
          start_date: '2026-01-01',
          due_date: null,
          created_at: now,
        },
      ],
      [
        {
          id: 't',
          project_id: 'pr',
          title: 't',
          description: '',
          status: 'done',
          priority: 'low',
          due_date: null,
          completed_at: now,
          created_at: now,
        },
      ],
    );
    expect(result.projects[0].status).toBe('completed');
    expect(result.goals[0].status).toBe('completed');
    expect(result.visions[0].progress).toBe(100);
  });

  it('leaves empty hierarchies at zero progress', () => {
    const result = recalculateAllHierarchicalProgress([], [], [], [], []);
    expect(result.pillars).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.tasks).toEqual([]);
  });
});
