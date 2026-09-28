import { useCallback, useEffect, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { InboxItem } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createInboxService } from '../services/inboxService';
import { useInboxStore } from '../store/inboxStore';

export function useInbox(repository: DataRepository | null) {
  const service = useMemo(() => (repository ? createInboxService(repository) : null), [repository]);
  const inboxItems = useInboxStore((state) => state.inboxItems);
  const setInboxItems = useInboxStore((state) => state.setInboxItems);
  const load = useCallback(() => (service ? service.list() : Promise.resolve([] as InboxItem[])), [service]);
  const query = useRepositoryQuery(load, Boolean(service));

  useEffect(() => {
    if (query.data) setInboxItems(query.data);
  }, [query.data, setInboxItems]);

  const upsert = useCallback(
    async (item: InboxItem) => {
      if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ صندوق الوارد.');
      const saved = await service.upsert(await repository.load(), item);
      setInboxItems((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      return saved;
    },
    [repository, service, setInboxItems],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!service || !repository) throw new Error('المستودع غير جاهز لحذف عنصر الوارد.');
      await service.remove(await repository.load(), id);
      setInboxItems((current) => current.filter((item) => item.id !== id));
    },
    [repository, service, setInboxItems],
  );

  return { ...query, data: inboxItems, inboxItems, upsert, remove };
}
