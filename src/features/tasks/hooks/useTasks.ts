import { useCallback, useEffect, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { Task } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createTasksService } from '../services/tasksService';
import { useTaskStore } from '../store/taskStore';

export function useTasks(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createTasksService(repository) : null, [repository]);
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const load = useCallback(() => service ? service.list() : Promise.resolve([] as Task[]), [service]);
  const query = useRepositoryQuery(load, Boolean(service));

  useEffect(() => {
    if (query.data) setTasks(query.data);
  }, [query.data, setTasks]);

  const create = useCallback(async (task: Task) => {
    if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ المهام.');
    const saved = await service.create(await repository.load(), task);
    setTasks((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    return saved;
  }, [repository, service, setTasks]);

  const update = useCallback(async (task: Task) => {
    if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ المهام.');
    const saved = await service.update(await repository.load(), task);
    setTasks((current) => current.map((item) => item.id === saved.id ? saved : item));
    return saved;
  }, [repository, service, setTasks]);

  const remove = useCallback(async (taskId: string) => {
    if (!service || !repository) throw new Error('المستودع غير جاهز لحذف المهام.');
    await service.delete(await repository.load(), taskId);
    setTasks((current) => current.filter((item) => item.id !== taskId));
  }, [repository, service, setTasks]);

  return { ...query, data: tasks, tasks, create, update, remove };
}
