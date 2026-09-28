import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataRepository } from '../../../data/repository';
import { useIbadat } from './useIbadat';
import { useIbadatStore } from '../store/ibadatStore';

function makeRepository(loadImpl: () => Promise<unknown> = async () => ({})) {
  return { load: loadImpl, save: vi.fn(), clear: vi.fn() } as unknown as DataRepository;
}

describe('useIbadat', () => {
  beforeEach(() => {
    useIbadatStore.getState().setWorshipDefinitions([]);
    useIbadatStore.getState().setWorshipLogs([]);
  });

  it('stays empty without a repository', () => {
    const { result } = renderHook(() => useIbadat(null));
    expect(result.current.worshipDefinitions).toEqual([]);
    expect(result.current.worshipLogs).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads definitions and logs, then saves a log', async () => {
    const repository = makeRepository(async () => ({
      worshipDefinitions: [{ id: 'def-1', title: 'ورد الصباح' }],
      worshipLogs: [{ id: 'log-1' }],
    }));
    const { result } = renderHook(() => useIbadat(repository));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.worshipDefinitions.map((definition) => definition.id)).toEqual(['def-1']);
    expect(result.current.worshipLogs.map((log) => log.id)).toEqual(['log-1']);

    const saved = await act(async () =>
      result.current.saveLog({ id: 'log-2', worship_definition_id: 'def-1', date: '2026-01-01' } as never),
    );
    expect(saved.id).toBe('log-2');
    await waitFor(() => expect(result.current.worshipLogs.map((log) => log.id)).toEqual(['log-2', 'log-1']));
  });

  it('rejects saves without a repository', async () => {
    const { result } = renderHook(() => useIbadat(null));
    await expect(result.current.saveLog({ id: 'x' } as never)).rejects.toThrow('غير جاهز');
  });
});
