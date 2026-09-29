import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataRepository } from '../../../data/repository';
import { useHabits } from './useHabits';
import { useHabitStore } from '../store/habitStore';

function makeRepository(loadImpl: () => Promise<unknown> = async () => ({})) {
  return { load: loadImpl, save: vi.fn(), clear: vi.fn() } as unknown as DataRepository;
}

describe('useHabits', () => {
  beforeEach(() => {
    useHabitStore.getState().setHabits([]);
  });

  it('stays empty without a repository', () => {
    const { result } = renderHook(() => useHabits(null));
    expect(result.current.habits).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads, creates, checks in, and removes habits', async () => {
    const repository = makeRepository(async () => ({ habits: [{ id: 'seed', title: 'عادة' }] }));
    const { result } = renderHook(() => useHabits(repository));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.habits.map((habit) => habit.id)).toEqual(['seed']);

    const created = await act(async () => result.current.create({ id: 'habit-1', title: 'قراءة' } as never));
    expect(created.id).toBe('habit-1');
    await waitFor(() => expect(result.current.habits.map((habit) => habit.id)).toEqual(['habit-1', 'seed']));

    await act(async () => result.current.checkIn({ id: 'habit-1', title: 'قراءة', longest_streak: 5 } as never));
    await waitFor(() => expect(result.current.habits[0].longest_streak).toBe(5));

    await act(async () => result.current.remove('habit-1'));
    await waitFor(() => expect(result.current.habits.map((habit) => habit.id)).toEqual(['seed']));
  });

  it('rejects mutations without a repository', async () => {
    const { result } = renderHook(() => useHabits(null));
    await expect(result.current.create({ id: 'x' } as never)).rejects.toThrow('غير جاهز');
    await expect(result.current.remove('x')).rejects.toThrow('غير جاهز');
  });
});
