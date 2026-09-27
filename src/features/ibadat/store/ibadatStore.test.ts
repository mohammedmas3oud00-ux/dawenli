import { describe, expect, it } from 'vitest';
import { useIbadatStore } from './ibadatStore';

describe('ibadat store', () => {
  it('keeps definitions and logs independently updateable', () => {
    useIbadatStore.setState({ worshipDefinitions: [], worshipLogs: [] });
    useIbadatStore.getState().setWorshipDefinitions([{ id: 'worship-1' } as never]);
    useIbadatStore.getState().setWorshipLogs([{ id: 'log-1' } as never]);
    expect(useIbadatStore.getState().worshipDefinitions[0].id).toBe('worship-1');
    expect(useIbadatStore.getState().worshipLogs[0].id).toBe('log-1');
    useIbadatStore.setState({ worshipDefinitions: [], worshipLogs: [] });
  });
});
