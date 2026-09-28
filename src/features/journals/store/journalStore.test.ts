import { describe, expect, it } from 'vitest';
import { useJournalStore } from './journalStore';

describe('journal store', () => {
  it('accepts direct arrays and functional updaters', () => {
    useJournalStore.getState().setJournals([{ id: 'journal-1' } as never]);
    useJournalStore.getState().setJournals((current) => [...current, { id: 'journal-2' } as never]);
    expect(useJournalStore.getState().journals.map((journal) => journal.id)).toEqual(['journal-1', 'journal-2']);
  });
});
