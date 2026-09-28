import { describe, expect, it } from 'vitest';
import { determineTaskEnergy, estimateTaskDuration, getRecommendedTasks } from './taskRecommender';
import type { Pillar, Project, Task, ValueGoal } from '../types/hierarchical';

describe('task recommendations', () => {
  const now = new Date().toISOString();
  const task: Task = {
    id: 't',
    project_id: 'pr',
    title: 'task',
    description: '',
    status: 'todo',
    priority: 'low',
    due_date: null,
    completed_at: null,
    estimated_hours: 2,
    energy_level: 'high',
    created_at: now,
  };
  const project: Project = {
    id: 'pr',
    goal_id: 'g',
    title: 'project',
    description: '',
    status: 'in_progress',
    progress: 0,
    start_date: '2026-01-01',
    due_date: null,
    created_at: now,
  };
  const goal: ValueGoal = {
    id: 'g',
    pillar_id: 'p',
    vision_id: null,
    title: 'goal',
    description: '',
    status: 'in_progress',
    target_date: null,
    progress: 0,
    created_at: now,
  };
  const pillar: Pillar = {
    id: 'p',
    title: 'pillar',
    description: '',
    pillar_group: 'Growth',
    purpose: '',
    priority: 1,
    show_on_home: true,
    status: 'active',
    progress: 0,
    created_at: now,
  };

  it('uses stored estimates and energy', () => {
    expect(estimateTaskDuration(task)).toBe(120);
    expect(determineTaskEnergy(task)).toBe('high');
  });

  it('uses priority defaults when duration and energy are missing', () => {
    expect(estimateTaskDuration({ ...task, estimated_hours: null, priority: 'high' })).toBe(45);
    expect(estimateTaskDuration({ ...task, estimated_hours: null, priority: 'medium' })).toBe(30);
    expect(estimateTaskDuration({ ...task, estimated_hours: null, priority: 'low' })).toBe(15);
    expect(determineTaskEnergy({ ...task, energy_level: null, priority: 'medium' })).toBe('medium');
    expect(determineTaskEnergy({ ...task, energy_level: null, priority: 'low' })).toBe('low');
  });

  it('ranks overdue and matching tasks with useful reasons', () => {
    const overdue = {
      ...task,
      id: 'overdue',
      estimated_hours: 1,
      priority: 'high',
      due_date: '2020-01-01',
      status: 'in_progress' as const,
    };
    const results = getRecommendedTasks(
      [task, overdue, { ...task, id: 'done', status: 'done' }],
      [project],
      [goal],
      [pillar],
      {
        availableMinutes: 60,
        energyLevel: 'high',
      },
    );
    expect(results[0].task.id).toBe('overdue');
    expect(results[0].urgencyLabel).toContain('متأخرة');
    expect(results[0].reasons.length).toBeLessThanOrEqual(3);
    expect(results.some((item) => item.task.id === 'done')).toBe(false);
  });

  it('penalizes tasks that exceed time or energy availability', () => {
    const result = getRecommendedTasks(
      [{ ...task, estimated_hours: 4, energy_level: 'high' }],
      [project],
      [goal],
      [pillar],
      {
        availableMinutes: 15,
        energyLevel: 'low',
      },
    )[0];
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(80);
  });

  it('excludes orphan tasks and tasks outside the selected pillar', () => {
    const orphan = { ...task, id: 'orphan', project_id: 'missing' };
    expect(
      getRecommendedTasks([task, orphan], [project], [goal], [pillar], {
        availableMinutes: 120,
        energyLevel: 'high',
        pillarId: 'p',
      }).map((result) => result.task.id),
    ).toEqual(['t']);
    expect(
      getRecommendedTasks([task], [project], [goal], [pillar], {
        availableMinutes: 120,
        energyLevel: 'high',
        pillarId: 'other',
      }),
    ).toEqual([]);
  });
});
