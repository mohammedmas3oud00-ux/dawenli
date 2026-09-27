import type { DataRepository } from '../../../data/repository';
import type { AppDataSnapshot, InboxItem } from '../../../types/hierarchical';
import { toServiceError } from '../../../shared/services/repositoryErrors';

export function createInboxService(repository: DataRepository) {
  const save = async (snapshot: AppDataSnapshot) => { try { await repository.save(snapshot); } catch (error) { throw toServiceError(error, 'تعذر حفظ صندوق الوارد.'); } };
  return {
    async list() { try { return (await repository.load()).inboxItems; } catch (error) { throw toServiceError(error, 'تعذر تحميل صندوق الوارد.'); } },
    async upsert(snapshot: AppDataSnapshot, item: InboxItem) {
      const next = { ...snapshot, inboxItems: [item, ...snapshot.inboxItems.filter((entry) => entry.id !== item.id)] };
      await save(next); return item;
    },
    async remove(snapshot: AppDataSnapshot, id: string) { await save({ ...snapshot, inboxItems: snapshot.inboxItems.filter((item) => item.id !== id) }); },
  };
}
