import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot, type DataRepository } from '../../../data/repository';
import type { AppDataSnapshot } from '../../../types/hierarchical';
import { createVaultsService } from './vaultsService';

describe('vaults service adapter', () => {
  it('upserts and removes through the existing snapshot repository', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repo: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = emptySnapshot();
    const item = {
      id: 'vault-1',
      title: 'كتاب',
      vault_type: 'books' as const,
      pillar_id: 'pillar-1',
      summary: '',
      content: '',
      tags: [],
      created_at: '2026-09-27',
    };
    const service = createVaultsService(repo);
    await service.upsert(snapshot, item);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ vaults: [item] }));
    await service.remove({ ...snapshot, vaults: [item] }, item.id);
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ vaults: [] }));
  });

  it('lists vaults and maps load failures', async () => {
    const service = createVaultsService({
      load: async () => ({ ...emptySnapshot(), vaults: [{ id: 'vault-1' }] }) as AppDataSnapshot,
      save: vi.fn(),
      clear: vi.fn(),
    });
    await expect(service.list()).resolves.toMatchObject([{ id: 'vault-1' }]);

    const failing: DataRepository = {
      load: async () => {
        throw new Error('offline');
      },
      save: vi.fn(),
      clear: vi.fn(),
    };
    await expect(createVaultsService(failing).list()).rejects.toThrow('offline');
  });

  it('replaces an existing vault with the same id', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repo: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = { ...emptySnapshot(), vaults: [{ id: 'same', title: 'old' } as never] };
    await createVaultsService(repo).upsert(snapshot, { id: 'same', title: 'new' } as never);
    const saved = save.mock.calls[0][0];
    expect(saved.vaults).toHaveLength(1);
    expect(saved.vaults[0].title).toBe('new');
  });

  it('persists snapshots directly and maps save failures', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repo: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    await expect(createVaultsService(repo).saveSnapshot(emptySnapshot())).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(1);

    const failing: DataRepository = {
      load: vi.fn(),
      save: async () => {
        throw new Error('storage full');
      },
      clear: vi.fn(),
    };
    await expect(createVaultsService(failing).saveSnapshot(emptySnapshot())).rejects.toThrow('storage full');
  });
});
