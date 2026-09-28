import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataRepository } from '../../../data/repository';
import { useInbox } from './useInbox';
import { useInboxStore } from '../store/inboxStore';

function makeRepository(loadImpl: () => Promise<unknown> = async () => ({})) {
  return { load: loadImpl, save: vi.fn(), clear: vi.fn() } as unknown as DataRepository;
}

describe('useInbox', () => {
  beforeEach(() => {
    useInboxStore.getState().setInboxItems([]);
  });

  it('stays empty without a repository', () => {
    const { result } = renderHook(() => useInbox(null));
    expect(result.current.inboxItems).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads, upserts, and removes inbox items', async () => {
    const repository = makeRepository(async () => ({ inboxItems: [{ id: 'seed', title: 'فكرة' }] }));
    const { result } = renderHook(() => useInbox(repository));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.inboxItems.map((item) => item.id)).toEqual(['seed']);

    const saved = await act(async () =>
      result.current.upsert({ id: 'inbox-1', title: 'فكرة جديدة', status: 'inbox' } as never),
    );
    expect(saved.id).toBe('inbox-1');
    await waitFor(() => expect(result.current.inboxItems.map((item) => item.id)).toEqual(['inbox-1', 'seed']));

    await act(async () => result.current.remove('inbox-1'));
    await waitFor(() => expect(result.current.inboxItems.map((item) => item.id)).toEqual(['seed']));
  });

  it('rejects mutations without a repository', async () => {
    const { result } = renderHook(() => useInbox(null));
    await expect(result.current.upsert({ id: 'x' } as never)).rejects.toThrow('غير جاهز');
    await expect(result.current.remove('x')).rejects.toThrow('غير جاهز');
  });
});
