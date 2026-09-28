import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataRepository } from '../../../data/repository';
import { useVaults } from './useVaults';
import { useVaultStore } from '../store/vaultStore';

function makeRepository(loadImpl: () => Promise<unknown> = async () => ({})) {
  return { load: loadImpl, save: vi.fn(), clear: vi.fn() } as unknown as DataRepository;
}

describe('useVaults', () => {
  beforeEach(() => {
    useVaultStore.getState().setVaults([]);
  });

  it('stays empty without a repository', () => {
    const { result } = renderHook(() => useVaults(null));
    expect(result.current.vaults).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads, upserts, and removes vault items', async () => {
    const repository = makeRepository(async () => ({ vaults: [{ id: 'seed', title: 'كتاب' }] }));
    const { result } = renderHook(() => useVaults(repository));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.vaults.map((item) => item.id)).toEqual(['seed']);

    const saved = await act(async () =>
      result.current.upsert({ id: 'vault-1', title: 'كتاب جديد', type: 'books' } as never),
    );
    expect(saved.id).toBe('vault-1');
    await waitFor(() => expect(result.current.vaults.map((item) => item.id)).toEqual(['vault-1', 'seed']));

    await act(async () => result.current.remove('vault-1'));
    await waitFor(() => expect(result.current.vaults.map((item) => item.id)).toEqual(['seed']));
  });

  it('rejects mutations without a repository', async () => {
    const { result } = renderHook(() => useVaults(null));
    await expect(result.current.upsert({ id: 'x' } as never)).rejects.toThrow('غير جاهز');
    await expect(result.current.remove('x')).rejects.toThrow('غير جاهز');
  });
});
