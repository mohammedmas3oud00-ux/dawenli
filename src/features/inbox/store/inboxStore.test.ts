import { describe, expect, it } from 'vitest';
import { useInboxStore } from './inboxStore';

describe('inbox store', () => {
  it('supports functional updates', () => {
    useInboxStore.setState({ inboxItems: [] });
    useInboxStore.getState().setInboxItems((items) => [...items, { id: 'inbox-1' } as never]);
    expect(useInboxStore.getState().inboxItems[0].id).toBe('inbox-1');
    useInboxStore.setState({ inboxItems: [] });
  });
});
