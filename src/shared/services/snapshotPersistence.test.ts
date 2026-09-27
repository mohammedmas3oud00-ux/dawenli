import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../data/repository';
import type { DataRepository } from '../../data/repository';
import { createSnapshotSaveQueue, enqueueSnapshotSave } from './snapshotPersistence';

describe('snapshot persistence queue', () => {
  it('serializes saves and continues after a rejected write', async () => {
    const save = vi.fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const queue = createSnapshotSaveQueue();
    await expect(enqueueSnapshotSave(queue, repository, emptySnapshot())).rejects.toThrow('temporary');
    await expect(enqueueSnapshotSave(queue, repository, emptySnapshot())).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(2);
  });
});
