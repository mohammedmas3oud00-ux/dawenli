import { useCallback, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { Task } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createTasksService } from '../services/tasksService';

export function useTasks(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createTasksService(repository) : null, [repository]);
  const load = useCallback(() => service ? service.list() : Promise.resolve([] as Task[]), [service]);
  return useRepositoryQuery(load, Boolean(service));
}
