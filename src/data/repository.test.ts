import { describe, expect, it } from 'vitest';
import { emptySnapshot, normalizeSnapshot } from './repository';

describe('repository snapshot normalization', () => {
  it('fills database-required defaults before persistence', () => {
    const snapshot = normalizeSnapshot({
      ...emptySnapshot(),
      projects: [{ id: 'project-1' } as never],
      tasks: [{ id: 'task-1' } as never],
      habits: [{ id: 'habit-1' } as never],
      reviews: [{ id: 'review-1' } as never],
    });

    expect(snapshot.projects[0].custom_fields).toEqual({});
    expect(snapshot.tasks[0].custom_fields).toEqual({});
    expect(snapshot.habits[0].custom_days).toEqual([]);
    expect(snapshot.habits[0].longest_streak).toBe(0);
    expect(snapshot.reviews[0].focus_goal_ids).toEqual([]);
    expect(snapshot.reviews[0].focus_project_ids).toEqual([]);
  });
});
