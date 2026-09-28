import type { DataRepository } from '../../../data/repository';
import type { AppDataSnapshot, Task } from '../../../types/hierarchical';
import { toServiceError } from '../../../shared/services/repositoryErrors';

export function createTasksService(repository: DataRepository) {
  return {
    async list() {
      try {
        return (await repository.load()).tasks;
      } catch (error) {
        throw toServiceError(error, 'تعذر تحميل المهام.');
      }
    },
    async saveSnapshot(snapshot: AppDataSnapshot) {
      try {
        await repository.save(snapshot);
      } catch (error) {
        throw toServiceError(error, 'تعذر حفظ المهام.');
      }
    },
    async create(snapshot: AppDataSnapshot, task: Task) {
      const next = { ...snapshot, tasks: [task, ...snapshot.tasks] };
      await this.saveSnapshot(next);
      return task;
    },
    async update(snapshot: AppDataSnapshot, task: Task) {
      const next = { ...snapshot, tasks: snapshot.tasks.map((item) => (item.id === task.id ? task : item)) };
      await this.saveSnapshot(next);
      return task;
    },
    async delete(snapshot: AppDataSnapshot, taskId: string) {
      const next = { ...snapshot, tasks: snapshot.tasks.filter((item) => item.id !== taskId) };
      await this.saveSnapshot(next);
    },
  };
}
