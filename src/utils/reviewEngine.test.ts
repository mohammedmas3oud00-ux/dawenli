import { describe, expect, it } from 'vitest';
import {
  calculateSystemHealthScore,
  generateAutomatedAudit,
  generateSystemSnapshot,
  getInitialSeedReviews,
} from './reviewEngine';

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

describe('system health score', () => {
  it('rewards completion and penalizes overdue tasks', () => {
    const perfect = calculateSystemHealthScore({
      overall_completion_rate: 100,
      tasks_overdue_count: 0,
      projects_active_count: 3,
    } as never);
    const burdened = calculateSystemHealthScore({
      overall_completion_rate: 0,
      tasks_overdue_count: 10,
      projects_active_count: 3,
    } as never);
    expect(perfect).toBe(100);
    expect(burdened).toBeLessThan(perfect);
    expect(burdened).toBeGreaterThanOrEqual(10);
  });

  it('penalizes an excessive number of active projects', () => {
    expect(
      calculateSystemHealthScore({
        overall_completion_rate: 50,
        tasks_overdue_count: 0,
        projects_active_count: 12,
      } as never),
    ).toBeLessThan(
      calculateSystemHealthScore({
        overall_completion_rate: 50,
        tasks_overdue_count: 0,
        projects_active_count: 4,
      } as never),
    );
  });
});

describe('automated audit', () => {
  function audit(frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly', overdue = true) {
    return generateAutomatedAudit(
      frequency,
      [pillar('p1', 80), pillar('p2', 10)],
      [],
      [],
      [{ id: 'project-1', status: 'in_progress' } as never],
      overdue
        ? [
            { id: 'done', status: 'done', due_date: '2020-01-01' } as never,
            { id: 'late', status: 'todo', due_date: '2020-01-01' } as never,
          ]
        : [{ id: 'done', status: 'done', due_date: '2099-01-01' } as never],
    );
  }

  it('reports strengths and bottlenecks for a daily review', () => {
    const result = audit('daily');
    expect(result.strengths.some((item) => item.includes('إنجاز'))).toBe(true);
    expect(result.bottlenecks.some((item) => item.includes('متأخرة'))).toBe(true);
    expect(result.recommendations.some((item) => item.includes('واحدة رئيسية'))).toBe(true);
    expect(result.suggested_actions).toHaveLength(1);
    expect(result.suggested_actions[0].priority).toBe('high');
  });

  it('praises punctuality when nothing is overdue', () => {
    const result = audit('daily', false);
    expect(result.bottlenecks.some((item) => item.includes('متأخرة'))).toBe(false);
    expect(result.strengths.some((item) => item.includes('انضباط زمني'))).toBe(true);
  });

  it('tailors recommendations to each longer frequency', () => {
    expect(audit('weekly').recommendations.some((item) => item.includes('الأسبوع'))).toBe(true);
    expect(audit('monthly').recommendations.some((item) => item.includes('الشهر'))).toBe(true);
    expect(audit('quarterly').recommendations.some((item) => item.includes('ربع سنوي'))).toBe(true);
    expect(audit('yearly').recommendations.some((item) => item.includes('العام'))).toBe(true);
  });
});
