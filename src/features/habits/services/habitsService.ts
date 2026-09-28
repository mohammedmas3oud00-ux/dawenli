import type { DataRepository } from '../../../data/repository';
import type { AppDataSnapshot, Habit } from '../../../types/hierarchical';
import { toServiceError } from '../../../shared/services/repositoryErrors';

export function createHabitsService(repository: DataRepository) {
  return {
    async list() {
      try {
        return (await repository.load()).habits;
      } catch (error) {
        throw toServiceError(error, 'تعذر تحميل العادات.');
      }
    },
    async saveSnapshot(snapshot: AppDataSnapshot) {
      try {
        await repository.save(snapshot);
      } catch (error) {
        throw toServiceError(error, 'تعذر حفظ العادات.');
      }
    },
    async create(snapshot: AppDataSnapshot, habit: Habit) {
      const next = { ...snapshot, habits: [habit, ...snapshot.habits] };
      await this.saveSnapshot(next);
      return habit;
    },
    async update(snapshot: AppDataSnapshot, habit: Habit) {
      const next = { ...snapshot, habits: snapshot.habits.map((item) => (item.id === habit.id ? habit : item)) };
      await this.saveSnapshot(next);
      return habit;
    },
    async checkIn(snapshot: AppDataSnapshot, habit: Habit) {
      return this.update(snapshot, habit);
    },
    async delete(snapshot: AppDataSnapshot, habitId: string) {
      const next = { ...snapshot, habits: snapshot.habits.filter((item) => item.id !== habitId) };
      await this.saveSnapshot(next);
    },
  };
}
