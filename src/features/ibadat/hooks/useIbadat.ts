import { useCallback, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createIbadatService } from '../services/ibadatService';

export function useIbadat(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createIbadatService(repository) : null, [repository]);
  const load = useCallback(() => service ? service.list() : Promise.resolve({ definitions: [], logs: [] }), [service]);
  return useRepositoryQuery(load, Boolean(service));
}
