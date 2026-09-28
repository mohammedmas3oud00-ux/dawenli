import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRepositoryQuery } from './useRepositoryQuery';

describe('useRepositoryQuery', () => {
  it('loads data and exposes loading state', async () => {
    const load = vi.fn().mockResolvedValue(['one']);
    const { result } = renderHook(() => useRepositoryQuery(load));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['one']);
    expect(result.current.error).toBeNull();
    expect(load).toHaveBeenCalledOnce();
  });

  it('stays idle when disabled and can retry after an error', async () => {
    const load = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useRepositoryQuery(load, false));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();

    await result.current.retry();
    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
    expect(result.current.data).toBeNull();
  });

  it('normalizes non-error rejections', async () => {
    const load = vi.fn().mockRejectedValue('string failure');
    const { result } = renderHook(() => useRepositoryQuery(load));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error?.message).toBe('تعذر تحميل البيانات.');
  });
});
