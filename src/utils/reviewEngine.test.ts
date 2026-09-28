import { describe, expect, it } from 'vitest';
import { generateSystemSnapshot, getInitialSeedReviews } from './reviewEngine';

const pillar = (id: string, progress: number) => ({ id, title: id, progress, pillar_group: 'Growth' }) as never;

describe('review engine diagnostics', () => {
  it('summarizes task, project, pillar, and worship metrics', () => {
    const snapshot = generateSystemSnapshot(
      [pillar('p1', 80), pillar('p2', 20)],
      [],
      [],
      [{ id: 'project-1', status: 'in_progress' } as never],
      [
        { id: 'done', status: 'done', due_date: '2020-01-01' } as never,
        { id: 'pending', status: 'todo', due_date: '2020-01-01' } as never,
      ],
    );
    expect(snapshot).toMatchObject({
      tasks_completed_count: 1,
      tasks_pending_count: 1,
      tasks_overdue_count: 1,
      projects_active_count: 1,
      overall_completion_rate: 50,
      top_active_pillar: 'p1',
      lagging_pillar: 'p2',
      worship_compliance_rate: 0,
    });
    expect(snapshot.worship_progression_summary).toContain('لم تُفعّل');
  });

  it('limits diagnostics to a selected pillar', () => {
    const snapshot = generateSystemSnapshot(
      [pillar('p1', 80), pillar('p2', 20)],
      [],
      [{ id: 'g1', pillar_id: 'p1' } as never],
      [{ id: 'project-1', goal_id: 'g1', status: 'in_progress' } as never],
      [{ id: 'task-1', project_id: 'project-1', status: 'todo' } as never],
      'p1',
    );
    expect(snapshot.tasks_pending_count).toBe(1);
    expect(snapshot.overall_completion_rate).toBe(80);
    expect(snapshot.pillar_distribution).toHaveLength(1);
  });

  it('creates seed reviews with the supported frequencies', () => {
    const reviews = getInitialSeedReviews([pillar('p1', 50)], [], [], [], []);
    expect(reviews.length).toBeGreaterThanOrEqual(5);
    expect(new Set(reviews.map((review) => review.frequency))).toEqual(
      new Set(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    );
  });
});
