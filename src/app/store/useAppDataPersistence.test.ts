import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppDataPersistence, emptyAppSnapshot } from './useAppDataPersistence';

describe('useAppDataPersistence boundary', () => {
  it('stays reset while there is no authenticated or guest user', () => {
    const { result } = renderHook(() => useAppDataPersistence({ user: null, authStatus: 'signedOut' }));
    expect(result.current.dataReady).toBe(false);
    expect(result.current.loadError).toBeNull();
    expect(result.current.repository).toBeNull();
    expect(result.current.snapshot).toEqual(emptyAppSnapshot());
  });

  it('returns an empty application snapshot with every collection initialized', () => {
    const snapshot = emptyAppSnapshot();
    expect(snapshot.schemaVersion).toBe(5);
    expect(Object.values(snapshot).filter(Array.isArray)).toHaveLength(20);
  });
});
