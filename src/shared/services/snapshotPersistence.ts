import type { DataRepository } from '../../data/repository';
import type { AppDataSnapshot } from '../../types/hierarchical';

export type SnapshotSaveQueue = { current: Promise<void>; generation: number };

export function createSnapshotSaveQueue(): SnapshotSaveQueue {
  return { current: Promise.resolve(), generation: 0 };
}

export function invalidateSnapshotSaveQueue(queue: SnapshotSaveQueue): void {
  queue.generation += 1;
}

export function enqueueSnapshotSave(queue: SnapshotSaveQueue, repository: DataRepository, snapshot: AppDataSnapshot): Promise<void> {
  const generation = queue.generation;
  queue.current = queue.current.catch(() => undefined).then(() => {
    if (generation !== queue.generation) return;
    return repository.save(snapshot);
  });
  return queue.current;
}

export function enqueueSnapshotClear(queue: SnapshotSaveQueue, repository: DataRepository): Promise<void> {
  invalidateSnapshotSaveQueue(queue);
  queue.current = queue.current.catch(() => undefined).then(() => repository.clear());
  return queue.current;
}
