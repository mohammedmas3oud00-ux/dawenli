import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../../data/repository';
import type { DataRepository } from '../../../data/repository';
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
});
