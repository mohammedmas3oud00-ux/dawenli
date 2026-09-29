import { describe, expect, it, vi } from 'vitest';
import { createIbadatService } from './ibadatService';
import { emptySnapshot, type DataRepository } from '../../../data/repository';
import type { AppDataSnapshot } from '../../../types/hierarchical';

describe('ibadat service adapter', () => {
  it('keeps the snapshot contract while saving one log', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = emptySnapshot();
    const log = {
      id: 'log-1',
      worship_id: 'worship-1',
      date: '2026-09-27',
      is_completed: true,
      created_at: '2026-09-27T00:00:00Z',
    };

    await createIbadatService(repository).saveLog(snapshot, log);

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ worshipLogs: [log] }));
  });

  it('lists definitions and logs together with error mapping', async () => {
    const service = createIbadatService({
      load: async () =>
        ({
          ...emptySnapshot(),
          worshipDefinitions: [{ id: 'worship-1' }],
          worshipLogs: [{ id: 'log-1' }],
        }) as AppDataSnapshot,
      save: vi.fn(),
      clear: vi.fn(),
    });
    await expect(service.list()).resolves.toMatchObject({
      definitions: [{ id: 'worship-1' }],
      logs: [{ id: 'log-1' }],
    });

    const failing: DataRepository = {
      load: async () => {
        throw new Error('offline');
      },
      save: vi.fn(),
      clear: vi.fn(),
    };
    await expect(createIbadatService(failing).list()).rejects.toThrow('offline');
  });

  it('maps save failures and dedupes logs by id', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = { ...emptySnapshot(), worshipLogs: [{ id: 'log-1', note: 'old' } as never] };
    await createIbadatService(repository).saveLog(snapshot, { id: 'log-1', note: 'new' } as never);
    const saved = save.mock.calls[0][0];
    expect(saved.worshipLogs).toHaveLength(1);
    expect(saved.worshipLogs[0].note).toBe('new');

    const failing: DataRepository = {
      load: vi.fn(),
      save: async () => {
        throw new Error('storage full');
      },
      clear: vi.fn(),
    };
    await expect(createIbadatService(failing).saveLog(emptySnapshot(), { id: 'x' } as never)).rejects.toThrow(
      'storage full',
    );
  });
});
