import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataRepository } from '../../../data/repository';
import { useTasks } from './useTasks';
import { useTaskStore } from '../store/taskStore';

function makeRepository(list: () => Promise<unknown> = async () => ({})) {
  return { load: list, save: vi.fn(), clear: vi.fn() } as unknown as DataRepository;
}

describe('useTasks', () => {
  beforeEach(() => {
    useTaskStore.getState().setTasks([]);
  });

  it('exposes an empty list without a repository', () => {
    const { result } = renderHook(() => useTasks(null));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('creates, updates, and removes tasks through the repository', async () => {
    const repository = makeRepository(async () => ({ tasks: [{ id: 'seed', title: 'مهمة أولية' }] }));
    const { result } = renderHook(() => useTasks(repository));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks.map((task) => task.id)).toEqual(['seed']);

    const created = await act(async () => result.current.create({ id: 'task-1', title: 'مهمة' } as never));
    expect(created.id).toBe('task-1');
    await waitFor(() => expect(result.current.tasks.map((task) => task.id)).toEqual(['task-1', 'seed']));

    const updated = await act(async () => result.current.update({ id: 'task-1', title: 'مهمة محدثة' } as never));
    expect(updated.title).toBe('مهمة محدثة');
    await waitFor(() => expect(result.current.tasks[0].title).toBe('مهمة محدثة'));

    await act(async () => result.current.remove('task-1'));
    await waitFor(() => expect(result.current.tasks.map((task) => task.id)).toEqual(['seed']));
  });

  it('rejects mutations while the repository is unavailable', async () => {
    const { result } = renderHook(() => useTasks(null));
    await expect(result.current.create({ id: 'x' } as never)).rejects.toThrow('غير جاهز');
    await expect(result.current.update({ id: 'x' } as never)).rejects.toThrow('غير جاهز');
    await expect(result.current.remove('x')).rejects.toThrow('غير جاهز');
  });
});
