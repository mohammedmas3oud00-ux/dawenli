import { useCallback, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { Habit } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createHabitsService } from '../services/habitsService';

export function useHabits(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createHabitsService(repository) : null, [repository]);
  const load = useCallback(() => service ? service.list() : Promise.resolve([] as Habit[]), [service]);
  return useRepositoryQuery(load, Boolean(service));
}
