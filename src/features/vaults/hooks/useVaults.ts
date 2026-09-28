import { useCallback, useEffect, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { VaultItem } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createVaultsService } from '../services/vaultsService';
import { useVaultStore } from '../store/vaultStore';

export function useVaults(repository: DataRepository | null) {
  const service = useMemo(() => (repository ? createVaultsService(repository) : null), [repository]);
  const vaults = useVaultStore((state) => state.vaults);
  const setVaults = useVaultStore((state) => state.setVaults);
  const load = useCallback(() => (service ? service.list() : Promise.resolve([] as VaultItem[])), [service]);
  const query = useRepositoryQuery(load, Boolean(service));

  useEffect(() => {
    if (query.data) setVaults(query.data);
  }, [query.data, setVaults]);

  const upsert = useCallback(
    async (item: VaultItem) => {
      if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ الخزينة.');
      const saved = await service.upsert(await repository.load(), item);
      setVaults((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      return saved;
    },
    [repository, service, setVaults],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!service || !repository) throw new Error('المستودع غير جاهز لحذف عنصر الخزينة.');
      await service.remove(await repository.load(), id);
      setVaults((current) => current.filter((item) => item.id !== id));
    },
    [repository, service, setVaults],
  );

  return { ...query, data: vaults, vaults, upsert, remove };
}
