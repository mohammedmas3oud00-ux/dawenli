import { useCallback, useEffect, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { Habit } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createHabitsService } from '../services/habitsService';
import { useHabitStore } from '../store/habitStore';

export function useHabits(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createHabitsService(repository) : null, [repository]);
  const habits = useHabitStore((state) => state.habits);
  const setHabits = useHabitStore((state) => state.setHabits);
  const load = useCallback(() => service ? service.list() : Promise.resolve([] as Habit[]), [service]);
  const query = useRepositoryQuery(load, Boolean(service));

  useEffect(() => {
    if (query.data) setHabits(query.data);
  }, [query.data, setHabits]);

  const create = useCallback(async (habit: Habit) => {
    if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ العادات.');
    const saved = await service.create(await repository.load(), habit);
    setHabits((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, [repository, service, setHabits]);

  const update = useCallback(async (habit: Habit) => {
    if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ العادات.');
    const saved = await service.update(await repository.load(), habit);
    setHabits((current) => current.map((item) => item.id === saved.id ? saved : item));
    return saved;
  }, [repository, service, setHabits]);

  const checkIn = useCallback(async (habit: Habit) => update(habit), [update]);

  const remove = useCallback(async (habitId: string) => {
    if (!service || !repository) throw new Error('المستودع غير جاهز لحذف العادات.');
    await service.delete(await repository.load(), habitId);
    setHabits((current) => current.filter((item) => item.id !== habitId));
  }, [repository, service, setHabits]);

  return { ...query, data: habits, habits, create, update, checkIn, remove };
}
