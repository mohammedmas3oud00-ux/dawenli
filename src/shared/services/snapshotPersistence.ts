import type { DataRepository } from '../../data/repository';
import type { AppDataSnapshot } from '../../types/hierarchical';

export type SnapshotSaveQueue = { current: Promise<void> };

export function createSnapshotSaveQueue(): SnapshotSaveQueue {
  return { current: Promise.resolve() };
}

export function enqueueSnapshotSave(queue: SnapshotSaveQueue, repository: DataRepository, snapshot: AppDataSnapshot): Promise<void> {
  queue.current = queue.current.catch(() => undefined).then(() => repository.save(snapshot));
  return queue.current;
}
