import type { DataRepository } from '../../../data/repository';
import type { AppDataSnapshot, WorshipLog } from '../../../types/hierarchical';
import { toServiceError } from '../../../shared/services/repositoryErrors';

export function createIbadatService(repository: DataRepository) {
  return {
    async list() {
      try { const snapshot = await repository.load(); return { definitions: snapshot.worshipDefinitions, logs: snapshot.worshipLogs }; } catch (error) { throw toServiceError(error, 'تعذر تحميل العبادات.'); }
    },
    async saveSnapshot(snapshot: AppDataSnapshot) {
      try { await repository.save(snapshot); } catch (error) { throw toServiceError(error, 'تعذر حفظ العبادات.'); }
    },
    async saveLog(snapshot: AppDataSnapshot, log: WorshipLog) {
      const next = { ...snapshot, worshipLogs: [log, ...snapshot.worshipLogs.filter((item) => item.id !== log.id)] };
      await this.saveSnapshot(next);
      return log;
    },
  };
}
