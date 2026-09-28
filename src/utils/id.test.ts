import { describe, expect, it, vi } from 'vitest';
import { createId } from './id';

describe('createId', () => {
  it('produces unique valid UUIDs', () => {
    const first = createId();
    const second = createId();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(first).not.toBe(second);
  });

  it('throws when secure generation is unavailable', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    expect(() => createId()).toThrow('secure UUID generation');
    vi.stubGlobal('crypto', original);
  });
});
