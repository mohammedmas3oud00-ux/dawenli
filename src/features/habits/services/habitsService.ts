import type { DataRepository } from '../../../data/repository';
import type { AppDataSnapshot, Habit } from '../../../types/hierarchical';
import { toServiceError } from '../../../shared/services/repositoryErrors';

export function createHabitsService(repository: DataRepository) {
  return {
    async list() {
      try { return (await repository.load()).habits; } catch (error) { throw toServiceError(error, 'تعذر تحميل العادات.'); }
    },
    async saveSnapshot(snapshot: AppDataSnapshot) {
      try { await repository.save(snapshot); } catch (error) { throw toServiceError(error, 'تعذر حفظ العادات.'); }
    },
    async checkIn(snapshot: AppDataSnapshot, habit: Habit) {
      const next = { ...snapshot, habits: snapshot.habits.map((item) => item.id === habit.id ? habit : item) };
      await this.saveSnapshot(next);
      return habit;
    },
  };
}
