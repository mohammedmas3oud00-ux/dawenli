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

  it('lists items and maps load failures', async () => {
    const service = createInboxService({
      load: async () => ({ inboxItems: [{ id: 'item-1' }] }),
      save: vi.fn(),
      clear: vi.fn(),
    });
    await expect(service.list()).resolves.toMatchObject([{ id: 'item-1' }]);

    const failing: DataRepository = {
      load: async () => {
        throw new Error('offline');
      },
      save: vi.fn(),
      clear: vi.fn(),
    };
    await expect(createInboxService(failing).list()).rejects.toThrow('offline');
  });

  it('replaces an existing item with the same id', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repo: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = { ...emptySnapshot(), inboxItems: [{ id: 'same', title: 'old' } as never] };
    await createInboxService(repo).upsert(snapshot, { id: 'same', title: 'new' } as never);
    const saved = save.mock.calls[0][0];
    expect(saved.inboxItems).toHaveLength(1);
    expect(saved.inboxItems[0].title).toBe('new');
  });

  it('removes items by id and maps save failures', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const repo: DataRepository = { load: vi.fn(), save, clear: vi.fn() };
    const snapshot = { ...emptySnapshot(), inboxItems: [{ id: 'keep' }, { id: 'drop' }] as never[] };
    await createInboxService(repo).remove(snapshot, 'drop');
    const saved = save.mock.calls[0][0];
    expect(saved.inboxItems.map((item: { id: string }) => item.id)).toEqual(['keep']);

    const failing: DataRepository = {
      load: vi.fn(),
      save: async () => {
        throw new Error('storage full');
      },
      clear: vi.fn(),
    };
    await expect(createInboxService(failing).remove(emptySnapshot(), 'x')).rejects.toThrow('storage full');
  });
});
