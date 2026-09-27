import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppDataSnapshot } from '../../types/hierarchical';
import type { RepositoryUser } from '../../shared/services/repositoryFactory';
import { createRepositoryForUser } from '../../shared/services/repositoryFactory';
import { supabase } from '../../shared/services/supabaseClient';
import { createSnapshotSaveQueue, enqueueSnapshotClear, enqueueSnapshotSave, invalidateSnapshotSaveQueue } from '../../shared/services/snapshotPersistence';
import { emptySnapshot, type DataRepository } from '../../data/repository';
import { recalculateAllHierarchicalProgress } from '../../utils/hierarchicalStore';
import { useAppStore } from './appStore';
import { useTaskStore } from '../../features/tasks/store/taskStore';
import { useHabitStore } from '../../features/habits/store/habitStore';
import { useInboxStore } from '../../features/inbox/store/inboxStore';
import { useVaultStore } from '../../features/vaults/store/vaultStore';
import { useIbadatStore } from '../../features/ibadat/store/ibadatStore';

type AuthStatus = 'loading' | 'signedOut' | 'guest' | 'authenticated';

interface UseAppDataPersistenceOptions {
  user: RepositoryUser | null;
  authStatus: AuthStatus;
  onLoadError?: (error: unknown) => void;
}

export function useAppDataPersistence({ user, authStatus, onLoadError }: UseAppDataPersistenceOptions) {
  const [dataReady, setDataReady] = useState(false);
  const repositoryRef = useRef<DataRepository | null>(null);
  const saveQueueRef = useRef(createSnapshotSaveQueue());
  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;

  const store = useAppStore();
  const { tasks } = useTaskStore();
  const { habits } = useHabitStore();
  const { inboxItems } = useInboxStore();
  const { vaults } = useVaultStore();
  const { worshipDefinitions, worshipLogs } = useIbadatStore();
  const {
    pillars, visions, goals, projects, reviews, focusSessions, timeBlocks,
    customFieldDefinitions, progressionPaths, quranKhatmas, quranHifzTrackers,
    sleepSchedules,
  } = store;

  const applySnapshot = useCallback((snapshot: AppDataSnapshot) => {
    const calculated = recalculateAllHierarchicalProgress(snapshot.pillars, snapshot.visions, snapshot.goals, snapshot.projects, snapshot.tasks);
    const setters = useAppStore.getState();
    setters.setPillars(calculated.pillars);
    setters.setVisions(calculated.visions);
    setters.setGoals(calculated.goals);
    setters.setProjects(calculated.projects);
    useTaskStore.getState().setTasks(calculated.tasks);
    setters.setReviews(snapshot.reviews);
    useInboxStore.getState().setInboxItems(snapshot.inboxItems);
    useHabitStore.getState().setHabits(snapshot.habits);
    useVaultStore.getState().setVaults(snapshot.vaults);
    useIbadatStore.getState().setWorshipDefinitions(snapshot.worshipDefinitions);
    useIbadatStore.getState().setWorshipLogs(snapshot.worshipLogs);
    setters.setFocusSessions(snapshot.focusSessions);
    setters.setTimeBlocks(snapshot.timeBlocks);
    setters.setCustomFieldDefinitions(snapshot.customFieldDefinitions);
    setters.setWorshipDefinitions(snapshot.worshipDefinitions);
    setters.setWorshipLogs(snapshot.worshipLogs);
    setters.setProgressionPaths(snapshot.progressionPaths);
    setters.setQuranKhatmas(snapshot.quranKhatmas);
    setters.setQuranHifzTrackers(snapshot.quranHifzTrackers);
    setters.setSleepSchedules(snapshot.sleepSchedules);
  }, []);

  useEffect(() => {
    if (!user || authStatus === 'loading' || authStatus === 'signedOut') {
      repositoryRef.current = null;
      setDataReady(false);
      return;
    }

    const repository = createRepositoryForUser(user, supabase);
    if (!repository) return;
    repositoryRef.current = repository;
    setDataReady(false);
    let active = true;

    void repository.load().then((snapshot) => {
      if (!active) return;
      applySnapshot(snapshot);
      setDataReady(true);
    }).catch((error: unknown) => {
      if (active) onLoadErrorRef.current?.(error);
    });

    return () => {
      active = false;
      invalidateSnapshotSaveQueue(saveQueueRef.current);
    };
  }, [applySnapshot, authStatus, user?.id, user?.isGuest]);

  const snapshot = useMemo<AppDataSnapshot>(() => ({
    schemaVersion: 4, pillars, visions, goals, projects, tasks, reviews, inboxItems, habits, vaults,
    focusSessions, timeBlocks, customFieldDefinitions, worshipDefinitions, worshipLogs, progressionPaths,
    quranKhatmas, quranHifzTrackers, sleepSchedules,
  }), [pillars, visions, goals, projects, tasks, reviews, inboxItems, habits, vaults, focusSessions, timeBlocks, customFieldDefinitions, worshipDefinitions, worshipLogs, progressionPaths, quranKhatmas, quranHifzTrackers, sleepSchedules]);

  const saveSnapshot = useCallback(async (nextSnapshot: AppDataSnapshot) => {
    const repository = repositoryRef.current;
    if (!repository) throw new Error('المستودع غير جاهز للحفظ.');
    await enqueueSnapshotSave(saveQueueRef.current, repository, nextSnapshot);
  }, []);

  const clearData = useCallback(async () => {
    const repository = repositoryRef.current;
    if (!repository) throw new Error('المستودع غير جاهز للحذف.');
    await enqueueSnapshotClear(saveQueueRef.current, repository);
  }, []);

  useEffect(() => {
    if (!dataReady || !repositoryRef.current) return;
    const timer = window.setTimeout(() => {
      void saveSnapshot(snapshot).catch((error: unknown) => onLoadErrorRef.current?.(error));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [dataReady, saveSnapshot, snapshot]);

  return { dataReady, snapshot, saveSnapshot, clearData, applySnapshot, repository: repositoryRef.current };
}

export function emptyAppSnapshot() {
  return emptySnapshot();
}
