import type { DataRepository } from '../../../data/repository';
import type { AppDataSnapshot, VaultItem } from '../../../types/hierarchical';
import { toServiceError } from '../../../shared/services/repositoryErrors';

export function createVaultsService(repository: DataRepository) {
  const save = async (snapshot: AppDataSnapshot) => { try { await repository.save(snapshot); } catch (error) { throw toServiceError(error, 'تعذر حفظ الخزائن.'); } };
  return {
    async list() { try { return (await repository.load()).vaults; } catch (error) { throw toServiceError(error, 'تعذر تحميل الخزائن.'); } },
    async saveSnapshot(snapshot: AppDataSnapshot) { await save(snapshot); },
    async upsert(snapshot: AppDataSnapshot, item: VaultItem) {
      const next = { ...snapshot, vaults: [item, ...snapshot.vaults.filter((entry) => entry.id !== item.id)] };
      await save(next); return item;
    },
    async remove(snapshot: AppDataSnapshot, id: string) {
      await save({ ...snapshot, vaults: snapshot.vaults.filter((item) => item.id !== id) });
    },
  };
}
