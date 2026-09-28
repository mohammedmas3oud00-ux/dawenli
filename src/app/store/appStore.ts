import { create } from 'zustand';
import type {
  AppDataSnapshot,
  CustomFieldDefinition,
  FocusSessionRecord,
  Habit,
  InboxItem,
  Pillar,
  ProgressionPath,
  Project,
  QuranHifzTracker,
  QuranKhatma,
  SleepSchedule,
  SystemReview,
  Task,
  TimeBlock,
  ValueGoal,
  Vision,
  VaultItem,
  WorshipDefinition,
  WorshipLog,
} from '../../types/hierarchical';
import { useJournalStore } from '../../features/journals/store/journalStore';
import { useCalendarStore } from '../../features/calendar/store/calendarStore';

export interface AppStoreState {
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
  reviews: SystemReview[];
  inboxItems: InboxItem[];
  habits: Habit[];
  vaults: VaultItem[];
  focusSessions: FocusSessionRecord[];
  timeBlocks: TimeBlock[];
  customFieldDefinitions: CustomFieldDefinition[];
  worshipDefinitions: WorshipDefinition[];
  worshipLogs: WorshipLog[];
  progressionPaths: ProgressionPath[];
  quranKhatmas: QuranKhatma[];
  quranHifzTrackers: QuranHifzTracker[];
  sleepSchedules: SleepSchedule[];
  setPillars(value: Pillar[] | ((current: Pillar[]) => Pillar[])): void;
  setVisions(value: Vision[] | ((current: Vision[]) => Vision[])): void;
  setGoals(value: ValueGoal[] | ((current: ValueGoal[]) => ValueGoal[])): void;
  setProjects(value: Project[] | ((current: Project[]) => Project[])): void;
  setTasks(value: Task[] | ((current: Task[]) => Task[])): void;
  setReviews(value: SystemReview[] | ((current: SystemReview[]) => SystemReview[])): void;
  setInboxItems(value: InboxItem[] | ((current: InboxItem[]) => InboxItem[])): void;
  setHabits(value: Habit[] | ((current: Habit[]) => Habit[])): void;
  setVaults(value: VaultItem[] | ((current: VaultItem[]) => VaultItem[])): void;
  setFocusSessions(value: FocusSessionRecord[] | ((current: FocusSessionRecord[]) => FocusSessionRecord[])): void;
  setTimeBlocks(value: TimeBlock[] | ((current: TimeBlock[]) => TimeBlock[])): void;
  setCustomFieldDefinitions(
    value: CustomFieldDefinition[] | ((current: CustomFieldDefinition[]) => CustomFieldDefinition[]),
  ): void;
  setWorshipDefinitions(value: WorshipDefinition[] | ((current: WorshipDefinition[]) => WorshipDefinition[])): void;
  setWorshipLogs(value: WorshipLog[] | ((current: WorshipLog[]) => WorshipLog[])): void;
  setProgressionPaths(value: ProgressionPath[] | ((current: ProgressionPath[]) => ProgressionPath[])): void;
  setQuranKhatmas(value: QuranKhatma[] | ((current: QuranKhatma[]) => QuranKhatma[])): void;
  setQuranHifzTrackers(value: QuranHifzTracker[] | ((current: QuranHifzTracker[]) => QuranHifzTracker[])): void;
  setSleepSchedules(value: SleepSchedule[] | ((current: SleepSchedule[]) => SleepSchedule[])): void;
}

const initial = {
  pillars: [],
  visions: [],
  goals: [],
  projects: [],
  tasks: [],
  reviews: [],
  inboxItems: [],
  habits: [],
  vaults: [],
  focusSessions: [],
  timeBlocks: [],
  customFieldDefinitions: [],
  worshipDefinitions: [],
  worshipLogs: [],
  progressionPaths: [],
  quranKhatmas: [],
  quranHifzTrackers: [],
  sleepSchedules: [],
};

export const useAppStore = create<AppStoreState>((set) => ({
  ...initial,
  setPillars: (value) => set((state) => ({ pillars: typeof value === 'function' ? value(state.pillars) : value })),
  setVisions: (value) => set((state) => ({ visions: typeof value === 'function' ? value(state.visions) : value })),
  setGoals: (value) => set((state) => ({ goals: typeof value === 'function' ? value(state.goals) : value })),
  setProjects: (value) => set((state) => ({ projects: typeof value === 'function' ? value(state.projects) : value })),
  setTasks: (value) => set((state) => ({ tasks: typeof value === 'function' ? value(state.tasks) : value })),
  setReviews: (value) => set((state) => ({ reviews: typeof value === 'function' ? value(state.reviews) : value })),
  setInboxItems: (value) =>
    set((state) => ({ inboxItems: typeof value === 'function' ? value(state.inboxItems) : value })),
  setHabits: (value) => set((state) => ({ habits: typeof value === 'function' ? value(state.habits) : value })),
  setVaults: (value) => set((state) => ({ vaults: typeof value === 'function' ? value(state.vaults) : value })),
  setFocusSessions: (value) =>
    set((state) => ({ focusSessions: typeof value === 'function' ? value(state.focusSessions) : value })),
  setTimeBlocks: (value) =>
    set((state) => ({ timeBlocks: typeof value === 'function' ? value(state.timeBlocks) : value })),
  setCustomFieldDefinitions: (value) =>
    set((state) => ({
      customFieldDefinitions: typeof value === 'function' ? value(state.customFieldDefinitions) : value,
    })),
  setWorshipDefinitions: (value) =>
    set((state) => ({ worshipDefinitions: typeof value === 'function' ? value(state.worshipDefinitions) : value })),
  setWorshipLogs: (value) =>
    set((state) => ({ worshipLogs: typeof value === 'function' ? value(state.worshipLogs) : value })),
  setProgressionPaths: (value) =>
    set((state) => ({ progressionPaths: typeof value === 'function' ? value(state.progressionPaths) : value })),
  setQuranKhatmas: (value) =>
    set((state) => ({ quranKhatmas: typeof value === 'function' ? value(state.quranKhatmas) : value })),
  setQuranHifzTrackers: (value) =>
    set((state) => ({ quranHifzTrackers: typeof value === 'function' ? value(state.quranHifzTrackers) : value })),
  setSleepSchedules: (value) =>
    set((state) => ({ sleepSchedules: typeof value === 'function' ? value(state.sleepSchedules) : value })),
}));

export function snapshotFromState(state: AppStoreState): AppDataSnapshot {
  return {
    schemaVersion: 5,
    pillars: state.pillars,
    visions: state.visions,
    goals: state.goals,
    projects: state.projects,
    tasks: state.tasks,
    reviews: state.reviews,
    inboxItems: state.inboxItems,
    habits: state.habits,
    vaults: state.vaults,
    focusSessions: state.focusSessions,
    timeBlocks: state.timeBlocks,
    customFieldDefinitions: state.customFieldDefinitions,
    worshipDefinitions: state.worshipDefinitions,
    worshipLogs: state.worshipLogs,
    progressionPaths: state.progressionPaths,
    quranKhatmas: state.quranKhatmas,
    quranHifzTrackers: state.quranHifzTrackers,
    sleepSchedules: state.sleepSchedules,
    journals: useJournalStore.getState().journals,
    calendarEvents: useCalendarStore.getState().calendarEvents,
  };
}
