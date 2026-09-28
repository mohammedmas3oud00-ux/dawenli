import { useCallback, useEffect, useMemo } from 'react';
import type { DataRepository } from '../../../data/repository';
import type { WorshipLog } from '../../../types/hierarchical';
import { useRepositoryQuery } from '../../../shared/hooks/useRepositoryQuery';
import { createIbadatService } from '../services/ibadatService';
import { useIbadatStore } from '../store/ibadatStore';

export function useIbadat(repository: DataRepository | null) {
  const service = useMemo(() => (repository ? createIbadatService(repository) : null), [repository]);
  const worshipDefinitions = useIbadatStore((state) => state.worshipDefinitions);
  const worshipLogs = useIbadatStore((state) => state.worshipLogs);
  const setWorshipDefinitions = useIbadatStore((state) => state.setWorshipDefinitions);
  const setWorshipLogs = useIbadatStore((state) => state.setWorshipLogs);
  const load = useCallback(
    () => (service ? service.list() : Promise.resolve({ definitions: [], logs: [] })),
    [service],
  );
  const query = useRepositoryQuery(load, Boolean(service));

  useEffect(() => {
    if (!query.data) return;
    setWorshipDefinitions(query.data.definitions);
    setWorshipLogs(query.data.logs);
  }, [query.data, setWorshipDefinitions, setWorshipLogs]);

  const saveLog = useCallback(
    async (log: WorshipLog) => {
      if (!service || !repository) throw new Error('المستودع غير جاهز لحفظ سجل العبادة.');
      const saved = await service.saveLog(await repository.load(), log);
      setWorshipLogs((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      return saved;
    },
    [repository, service, setWorshipLogs],
  );

  return {
    ...query,
    data: { definitions: worshipDefinitions, logs: worshipLogs },
    worshipDefinitions,
    worshipLogs,
    saveLog,
  };
}
