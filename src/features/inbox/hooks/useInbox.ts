import { useCallback, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { InboxItem } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createInboxService } from '../services/inboxService';

export function useInbox(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createInboxService(repository) : null, [repository]);
  const load = useCallback(() => service ? service.list() : Promise.resolve([] as InboxItem[]), [service]);
  return useRepositoryQuery(load, Boolean(service));
}
