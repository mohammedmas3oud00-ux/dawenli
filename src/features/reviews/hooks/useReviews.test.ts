import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Pillar,
  Project,
  ReviewActionItem,
  SystemReview,
  Task,
  ValueGoal,
  Vision,
  WorshipDefinition,
  WorshipLog,
} from '../../../types/hierarchical';
import { useReviews } from './useReviews';

const deps = {
  reviews: [] as SystemReview[],
  setReviews: vi.fn(),
  editingReview: null as SystemReview | null,
  pillars: [] as Pillar[],
  visions: [] as Vision[],
  goals: [] as ValueGoal[],
  projects: [{ id: 'project-1' } as never] as Project[],
  tasks: [] as Task[],
  worshipDefinitions: [] as WorshipDefinition[],
  worshipLogs: [] as WorshipLog[],
  applyStateUpdate: vi.fn(),
  onCloseEditor: vi.fn(),
};

function renderReviews() {
  return renderHook(() => useReviews(deps)).result;
}

describe('useReviews', () => {
  beforeEach(() => {
    deps.setReviews.mockReset();
    deps.applyStateUpdate.mockReset();
    deps.onCloseEditor.mockReset();
    deps.reviews = [];
    deps.editingReview = null;
    deps.projects = [{ id: 'project-1' } as never];
  });

  it('creates a review with defaults and a generated snapshot', () => {
    renderReviews().current.saveReview({ title: 'مراجعة الأسبوع', frequency: 'weekly' });
    const saved = deps.setReviews.mock.calls[0][0][0] as SystemReview;
    expect(saved.title).toBe('مراجعة الأسبوع');
    expect(saved.frequency).toBe('weekly');
    expect(saved.snapshot.tasks_completed_count).toBe(0);
    expect(deps.onCloseEditor).toHaveBeenCalledOnce();
  });

  it('updates an existing review in place', () => {
    deps.editingReview = { id: 'review-1', title: 'قديمة', frequency: 'daily' } as never;
    deps.reviews = [{ id: 'review-1', title: 'قديمة', frequency: 'daily' } as never];
    renderReviews().current.saveReview({ title: 'جديدة' });
    const updated = deps.setReviews.mock.calls[0][0][0] as SystemReview;
    expect(updated.id).toBe('review-1');
    expect(updated.title).toBe('جديدة');
    expect(updated.frequency).toBe('daily');
  });

  it('skips deletion when the user cancels the confirmation', () => {
    vi.stubGlobal('confirm', () => false);
    renderReviews().current.deleteReview('review-1');
    expect(deps.setReviews).not.toHaveBeenCalled();
  });

  it('deletes a review after confirmation', () => {
    vi.stubGlobal('confirm', () => true);
    deps.reviews = [{ id: 'review-1' } as never];
    renderReviews().current.deleteReview('review-1');
    expect(deps.setReviews).toHaveBeenCalledOnce();
  });

  it('converts an action item into a task and marks it converted', () => {
    const actionItem: ReviewActionItem = {
      id: 'action-1',
      title: 'مهمة مستخلصة',
      priority: 'high',
      is_converted: false,
    } as never;
    deps.reviews = [{ id: 'review-1', action_items: [actionItem] } as never];
    renderReviews().current.convertActionToTask(actionItem, 'review-1');
    expect(deps.applyStateUpdate).toHaveBeenCalledOnce();
    const updater = deps.setReviews.mock.calls[0][0] as (current: SystemReview[]) => SystemReview[];
    expect(updater(deps.reviews)[0].action_items[0].is_converted).toBe(true);
  });

  it('blocks conversion when no project exists', () => {
    vi.stubGlobal('alert', vi.fn());
    deps.projects = [];
    renderReviews().current.convertActionToTask({ id: 'action-1', title: 'x' } as never, 'review-1');
    expect(deps.applyStateUpdate).not.toHaveBeenCalled();
    expect(vi.mocked(alert)).toHaveBeenCalledOnce();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
