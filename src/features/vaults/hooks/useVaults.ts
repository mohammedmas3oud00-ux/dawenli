import { useCallback, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { VaultItem } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createVaultsService } from '../services/vaultsService';

export function useVaults(repository: DataRepository | null) {
  const service = useMemo(() => repository ? createVaultsService(repository) : null, [repository]);
  const load = useCallback(() => service ? service.list() : Promise.resolve([] as VaultItem[]), [service]);
  return useRepositoryQuery(load, Boolean(service));
}
