import { describe, expect, it } from 'vitest';
import { useCalendarStore } from '../../features/calendar/store/calendarStore';
import { useJournalStore } from '../../features/journals/store/journalStore';
import { snapshotFromState, useAppStore } from './appStore';

const collectionSetters = [
  'setPillars',
  'setVisions',
  'setGoals',
  'setProjects',
  'setReviews',
  'setInboxItems',
  'setHabits',
  'setVaults',
  'setFocusSessions',
  'setTimeBlocks',
  'setCustomFieldDefinitions',
  'setWorshipDefinitions',
  'setWorshipLogs',
  'setProgressionPaths',
  'setQuranKhatmas',
  'setQuranHifzTrackers',
  'setSleepSchedules',
] as const;

describe('app store snapshot contract', () => {
  it('starts empty and projects every entity collection', () => {
    useAppStore.setState({ pillars: [], tasks: [], worshipLogs: [] });
    const state = useAppStore.getState();
    const snapshot = snapshotFromState(state);
    expect(snapshot.schemaVersion).toBe(5);
    expect(snapshot.pillars).toEqual([]);
    expect(snapshot.tasks).toEqual([]);
    expect(snapshot.worshipLogs).toEqual([]);
    expect(snapshot.sleepSchedules).toEqual([]);
    expect(snapshot.journals).toEqual([]);
    expect(snapshot.calendarEvents).toEqual([]);
  });

  it('preserves functional setter semantics used by existing handlers', () => {
    useAppStore.getState().setTasks((current) => [...current, { id: 'task-1' } as never]);
    expect(useAppStore.getState().tasks.map((task) => task.id)).toContain('task-1');
    useAppStore.setState({ tasks: [] });
  });

  it('accepts direct arrays and functional updaters for every collection', () => {
    for (const setter of collectionSetters) {
      useAppStore.getState()[setter]([{ id: `${setter}-direct` } as never]);
      useAppStore.getState()[setter]((current) => [...current, { id: `${setter}-fn` } as never]);
    }
    const snapshot = snapshotFromState(useAppStore.getState());
    for (const setter of collectionSetters) {
      const key = setter.replace(/^set/, '').replace(/^./, (char) => char.toLowerCase());
      expect(snapshot[key]).toEqual([{ id: `${setter}-direct` }, { id: `${setter}-fn` }]);
    }
  });

  it('merges journal and calendar stores into the snapshot', () => {
    useJournalStore.getState().setJournals([{ id: 'journal-1' } as never]);
    useCalendarStore.getState().setCalendarEvents([{ id: 'event-1' } as never]);
    const snapshot = snapshotFromState(useAppStore.getState());
    expect(snapshot.journals.map((journal) => journal.id)).toContain('journal-1');
    expect(snapshot.calendarEvents.map((event) => event.id)).toContain('event-1');
    useJournalStore.getState().setJournals([]);
    useCalendarStore.getState().setCalendarEvents([]);
  });
});
