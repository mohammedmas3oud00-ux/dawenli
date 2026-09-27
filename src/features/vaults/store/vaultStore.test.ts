import { describe, expect, it } from 'vitest';
import { useVaultStore } from './vaultStore';

describe('vault store', () => {
  it('supports functional updates', () => {
    useVaultStore.setState({ vaults: [] });
    useVaultStore.getState().setVaults((items) => [...items, { id: 'vault-1' } as never]);
    expect(useVaultStore.getState().vaults[0].id).toBe('vault-1');
    useVaultStore.setState({ vaults: [] });
  });
});
