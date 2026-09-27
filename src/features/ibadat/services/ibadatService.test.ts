import { describe, expect, it, vi } from 'vitest';
import { createIbadatService } from './ibadatService';
import { emptySnapshot } from '../../../data/repository';
import type { DataRepository } from '../../../data/repository';

describe('ibadat service adapter', () => {
  it('keeps the snapshot contract while saving one log', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repository: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = emptySnapshot();
    const log = { id: 'log-1', worship_id: 'worship-1', date: '2026-09-27', is_completed: true, created_at: '2026-09-27T00:00:00Z' };

    await createIbadatService(repository).saveLog(snapshot, log);

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ worshipLogs: [log] }));
  });
});
