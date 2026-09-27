import { describe, expect, it } from 'vitest';
import { snapshotFromState, useAppStore } from './appStore';

describe('app store snapshot contract', () => {
  it('starts empty and projects every entity collection', () => {
    useAppStore.setState({ pillars: [], tasks: [], worshipLogs: [] });
    const state = useAppStore.getState();
    const snapshot = snapshotFromState(state);
    expect(snapshot.schemaVersion).toBe(4);
    expect(snapshot.pillars).toEqual([]);
    expect(snapshot.tasks).toEqual([]);
    expect(snapshot.worshipLogs).toEqual([]);
    expect(snapshot.sleepSchedules).toEqual([]);
  });

  it('preserves functional setter semantics used by existing handlers', () => {
    useAppStore.getState().setTasks((current) => [...current, { id: 'task-1' } as never]);
    expect(useAppStore.getState().tasks.map((task) => task.id)).toContain('task-1');
    useAppStore.setState({ tasks: [] });
  });
});
