import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot } from '../../../data/repository';
import type { DataRepository } from '../../../data/repository';
import { createInboxService } from './inboxService';

describe('inbox service adapter', () => {
  it('upserts an item without changing unrelated snapshot collections', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repo: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = emptySnapshot();
    const item = {
      id: 'inbox-1',
      title: 'فكرة',
      content: '',
      source_type: 'idea' as const,
      status: 'inbox' as const,
      captured_at: '2026-09-27',
      created_at: '2026-09-27',
      converted_to: null,
      converted_entity_id: null,
    };
    await createInboxService(repo).upsert(snapshot, item);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ inboxItems: [item], tasks: [] }));
  });
});
