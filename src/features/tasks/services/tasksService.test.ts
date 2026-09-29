import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot, type DataRepository } from '../../../data/repository';
import type { Task } from '../../../types/hierarchical';
import { createTasksService } from './tasksService';

const task = { id: 'task-1', title: 'Updated' } as Task;

describe('tasks service CRUD adapter', () => {
  it('updates and deletes through the repository snapshot boundary', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const service = createTasksService(repository);
    const snapshot = { ...emptySnapshot(), tasks: [{ id: 'task-1', title: 'Old' } as Task] };

    await service.update(snapshot, task);
    expect(save.mock.calls[0][0].tasks).toEqual([task]);
    await service.delete(snapshot, 'task-1');
    expect(save.mock.calls[1][0].tasks).toEqual([]);
  });

  it('prepends new tasks and lists them with error mapping', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const service = createTasksService(repository);
    await service.create(emptySnapshot(), task);
    expect(save.mock.calls[0][0].tasks).toEqual([task]);

    const listing = createTasksService({
      load: async () => ({ ...emptySnapshot(), tasks: [{ id: 'task-2' }] as Task[] }),
      save: vi.fn(),
      clear: vi.fn(),
    });
    await expect(listing.list()).resolves.toMatchObject([{ id: 'task-2' }]);

    const failing: DataRepository = {
      load: async () => {
        throw new Error('offline');
      },
      save: vi.fn(),
      clear: vi.fn(),
    };
    await expect(createTasksService(failing).list()).rejects.toThrow('offline');
  });

  it('maps save failures into service errors', async () => {
    const failing: DataRepository = {
      load: vi.fn(),
      save: async () => {
        throw new Error('storage full');
      },
      clear: vi.fn(),
    };
    await expect(createTasksService(failing).create(emptySnapshot(), task)).rejects.toThrow('storage full');
  });
});
