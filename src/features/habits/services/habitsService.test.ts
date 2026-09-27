import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot, type DataRepository } from '../../../data/repository';
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
});
