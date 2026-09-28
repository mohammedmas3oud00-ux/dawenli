import { describe, expect, it } from 'vitest';
import { emptySnapshot, normalizeSnapshot, normalizeSnapshotForDatabase } from './repository';

describe('repository snapshot normalization', () => {
  it('fills database-required defaults before persistence', () => {
    const snapshot = normalizeSnapshot({
      ...emptySnapshot(),
      projects: [{ id: 'project-1' } as never],
      tasks: [{ id: 'task-1' } as never],
      habits: [{ id: 'habit-1' } as never],
      reviews: [{ id: 'review-1' } as never],
      worshipDefinitions: [{ id: 'worship-1' } as never],
      worshipLogs: [{ id: 'log-1' } as never],
      progressionPaths: [{ id: 'path-1' } as never],
      quranHifzTrackers: [{ id: 'hifz-1' } as never],
      journals: [{ id: 'journal-1' } as never],
      calendarEvents: [{ id: 'event-1' } as never],
    });

    expect(snapshot.projects[0].custom_fields).toEqual({});
    expect(snapshot.tasks[0].custom_fields).toEqual({});
    expect(snapshot.habits[0].custom_days).toEqual([]);
    expect(snapshot.habits[0].longest_streak).toBe(0);
    expect(snapshot.reviews[0].focus_goal_ids).toEqual([]);
    expect(snapshot.reviews[0].focus_project_ids).toEqual([]);
    expect(snapshot.worshipDefinitions[0].scheduled_days).toEqual([]);
    expect(snapshot.worshipLogs[0].is_completed).toBe(false);
    expect(snapshot.progressionPaths[0].stages).toEqual([]);
    expect(snapshot.quranHifzTrackers[0].surahs).toEqual([]);
    expect(snapshot.journals[0].tags).toEqual([]);
    expect(snapshot.calendarEvents[0].recurrence).toEqual({ frequency: 'none', interval: 1 });
  });

  it('maps app fields and fills every live required row default', () => {
    const snapshot = normalizeSnapshot({
      ...emptySnapshot(),
      habits: [{ id: 'habit-1', longest_streak: 4 } as never],
      inboxItems: [{ id: 'inbox-1' } as never],
      worshipDefinitions: [{ id: 'worship-1' } as never],
      progressionPaths: [{ id: 'path-1' } as never],
      sleepSchedules: [{ id: 'sleep-1' } as never],
    });
    const payload = normalizeSnapshotForDatabase(snapshot, 'user-1');
    const habit = (payload.habits as Array<Record<string, unknown>>)[0];
    const inbox = (payload.inbox_items as Array<Record<string, unknown>>)[0];
    const worship = (payload.worship_definitions as Array<Record<string, unknown>>)[0];
    const path = (payload.progression_paths as Array<Record<string, unknown>>)[0];
    const sleep = (payload.sleep_schedules as Array<Record<string, unknown>>)[0];
    expect(habit.best_streak).toBe(4);
    expect(habit.longest_streak).toBe(4);
    expect(inbox.source_type).toBe('idea');
    expect(inbox.status).toBe('inbox');
    expect(worship.tracking_type).toBe('checkbox');
    expect(path.stage_start_date).toBeTruthy();
    expect(sleep.ultimate_bedtime).toBe('22:00');
  });
});
