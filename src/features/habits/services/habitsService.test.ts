import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot, type DataRepository } from '../../../data/repository';
import type { AppDataSnapshot } from '../../../types/hierarchical';
import type { Habit } from '../../../types/hierarchical';
import { createHabitsService } from './habitsService';

const habit = { id: 'habit-1', title: 'Updated' } as Habit;

describe('habits service CRUD adapter', () => {
  it('creates and checks in through the repository snapshot boundary', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const service = createHabitsService(repository);
    const snapshot = emptySnapshot();

    await service.create(snapshot, habit);
    expect(save.mock.calls[0][0].habits).toEqual([habit]);
    await service.checkIn({ ...snapshot, habits: [habit] }, { ...habit, title: 'Checked in' });
    expect(save.mock.calls[1][0].habits[0]).toMatchObject({ id: 'habit-1', title: 'Checked in' });
  });

  it('lists, updates, and deletes habits with error mapping', async () => {
    const listing = createHabitsService({
      load: async () => ({ ...emptySnapshot(), habits: [{ id: 'habit-2' }] as Habit[] }),
      save: vi.fn(),
      clear: vi.fn(),
    });
    await expect(listing.list()).resolves.toMatchObject([{ id: 'habit-2' }]);

    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const service = createHabitsService(repository);
    const start = {
      ...emptySnapshot(),
      habits: [
        { id: 'habit-1', title: 'A' },
        { id: 'habit-2', title: 'B' },
      ] as Habit[],
    };

    await service.update(start, { ...habit, title: 'Renamed' });
    expect((save.mock.calls[0][0] as AppDataSnapshot).habits.map((item) => item.title)).toEqual(['Renamed', 'B']);
    await service.delete(start, 'habit-2');
    expect((save.mock.calls[1][0] as AppDataSnapshot).habits.map((item) => item.id)).toEqual(['habit-1']);

    const failing: DataRepository = {
      load: async () => {
        throw new Error('offline');
      },
      save: async () => {
        throw new Error('storage full');
      },
      clear: vi.fn(),
    };
    await expect(createHabitsService(failing).list()).rejects.toThrow('offline');
    await expect(createHabitsService(failing).create(emptySnapshot(), habit)).rejects.toThrow('storage full');
  });
});
