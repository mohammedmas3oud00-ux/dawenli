import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../data/repository';
import { useAppDataPersistence, emptyAppSnapshot } from './useAppDataPersistence';
import { useAppStore } from './appStore';
import { useTaskStore } from '../../features/tasks/store/taskStore';

const { createRepositoryForUser } = vi.hoisted(() => ({ createRepositoryForUser: vi.fn() }));
vi.mock('../../shared/services/repositoryFactory', () => ({ createRepositoryForUser }));
vi.mock('../../shared/services/supabaseClient', () => ({ supabase: null, isSupabaseConfigured: false }));

function resetStores() {
  useAppStore.getState().setPillars([]);
  useAppStore.getState().setTasks([]);
  useTaskStore.getState().setTasks([]);
}

describe('useAppDataPersistence boundary', () => {
  beforeEach(() => {
    createRepositoryForUser.mockReset();
    resetStores();
  });

  afterEach(() => cleanup());

  it('stays reset while there is no authenticated or guest user', () => {
    const { result } = renderHook(() => useAppDataPersistence({ user: null, authStatus: 'signedOut' }));
    expect(result.current.dataReady).toBe(false);
    expect(result.current.loadError).toBeNull();
    expect(result.current.repository).toBeNull();
    expect(result.current.snapshot).toEqual(emptyAppSnapshot());
  });

  it('returns an empty application snapshot with every collection initialized', () => {
    const snapshot = emptyAppSnapshot();
    expect(snapshot.schemaVersion).toBe(5);
    expect(Object.values(snapshot).filter(Array.isArray)).toHaveLength(20);
  });

  it('loads and applies a guest snapshot into the shared stores', async () => {
    const repository = {
      load: vi.fn().mockResolvedValue({
        ...emptySnapshot(),
        pillars: [{ id: 'pillar-1' } as never],
        tasks: [{ id: 'task-1' } as never],
      }),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    createRepositoryForUser.mockReturnValue(repository);
    const options = {
      user: { email: 'guest', isGuest: true },
      authStatus: 'guest' as const,
    };
    const { result } = renderHook(() => useAppDataPersistence(options));
    await waitFor(() => expect(result.current.dataReady).toBe(true));
    expect(useAppStore.getState().pillars.map((pillar) => pillar.id)).toContain('pillar-1');
    expect(useTaskStore.getState().tasks.map((task) => task.id)).toContain('task-1');
    expect(result.current.repository).toBe(repository);
  });

  it('records load failures and retries on demand', async () => {
    const onLoadError = vi.fn();
    const repository = {
      load: vi.fn().mockRejectedValueOnce(new Error('cloud down')).mockResolvedValue(emptySnapshot()),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    createRepositoryForUser.mockReturnValue(repository);
    const options = {
      user: { id: 'user-1', email: 'user@example.com' },
      authStatus: 'authenticated' as const,
      onLoadError,
    };
    const { result } = renderHook(() => useAppDataPersistence(options));
    await waitFor(() => expect(result.current.loadError?.message).toBe('cloud down'));
    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(onLoadError).toHaveBeenCalledOnce();

    await act(async () => result.current.retryLoad());
    await waitFor(() => expect(result.current.dataReady).toBe(true));
    expect(result.current.loadError).toBeNull();
  });

  it('persists snapshots through the repository and clears on demand', async () => {
    const repository = {
      load: vi.fn().mockResolvedValue(emptySnapshot()),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    createRepositoryForUser.mockReturnValue(repository);
    const options = {
      user: { email: 'guest', isGuest: true },
      authStatus: 'guest' as const,
    };
    const { result } = renderHook(() => useAppDataPersistence(options));
    await waitFor(() => expect(result.current.dataReady).toBe(true));
    await result.current.saveSnapshot({ ...emptySnapshot(), tasks: [{ id: 'saved' } as never] });
    expect(repository.save).toHaveBeenCalled();
    await result.current.clearData();
    expect(repository.clear).toHaveBeenCalledOnce();
  });

  it('rejects saves and clears without a repository', async () => {
    const { result } = renderHook(() => useAppDataPersistence({ user: null, authStatus: 'signedOut' }));
    await expect(act(async () => result.current.saveSnapshot(emptySnapshot()))).rejects.toThrow('غير جاهز');
    await expect(act(async () => result.current.clearData())).rejects.toThrow('غير جاهز');
  });
});
