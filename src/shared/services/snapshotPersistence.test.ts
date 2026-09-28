import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../data/repository';
import type { DataRepository } from '../../data/repository';
import {
  createSnapshotSaveQueue,
  enqueueSnapshotClear,
  enqueueSnapshotSave,
  invalidateSnapshotSaveQueue,
} from './snapshotPersistence';

describe('snapshot persistence queue', () => {
  it('serializes saves and continues after a rejected write', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('temporary')).mockResolvedValueOnce(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const queue = createSnapshotSaveQueue();
    await expect(enqueueSnapshotSave(queue, repository, emptySnapshot())).rejects.toThrow('temporary');
    await expect(enqueueSnapshotSave(queue, repository, emptySnapshot())).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('invalidates pending saves before clearing the repository', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear };
    const queue = createSnapshotSaveQueue();
    const pendingSave = enqueueSnapshotSave(queue, repository, emptySnapshot());
    invalidateSnapshotSaveQueue(queue);
    await enqueueSnapshotClear(queue, repository);
    await pendingSave;
    expect(save).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('saves only the most recent snapshot of a coalesced batch', async () => {
    const saves: unknown[] = [];
    const save = vi.fn(async (snapshot: unknown) => {
      saves.push(snapshot);
    });
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const queue = createSnapshotSaveQueue();
    const first = enqueueSnapshotSave(queue, repository, { ...emptySnapshot(), schemaVersion: 5 });
    invalidateSnapshotSaveQueue(queue);
    const second = enqueueSnapshotSave(queue, repository, { ...emptySnapshot(), schemaVersion: 6 });
    await Promise.all([first, second]);
    expect(saves).toHaveLength(1);
    expect(saves[0]).toMatchObject({ schemaVersion: 6 });
  });

  it('runs queued saves sequentially in arrival order', async () => {
    const order: string[] = [];
    const save = vi.fn(async (snapshot: { pillars: Array<{ id: string }> }) => {
      order.push(snapshot.pillars[0].id);
    });
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const queue = createSnapshotSaveQueue();
    await Promise.all([
      enqueueSnapshotSave(queue, repository, { ...emptySnapshot(), pillars: [{ id: 'first' }] }),
      enqueueSnapshotSave(queue, repository, { ...emptySnapshot(), pillars: [{ id: 'second' }] }),
    ]);
    expect(order).toEqual(['first', 'second']);
  });
});
