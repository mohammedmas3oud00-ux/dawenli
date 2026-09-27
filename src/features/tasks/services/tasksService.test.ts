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
});
