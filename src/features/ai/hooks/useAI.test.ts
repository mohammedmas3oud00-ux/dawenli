import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestAi, refreshGeminiCredentialStatus, saveGeminiCredential, deleteGeminiCredential } = vi.hoisted(() => ({
  requestAi: vi.fn(),
  refreshGeminiCredentialStatus: vi.fn(),
  saveGeminiCredential: vi.fn(),
  deleteGeminiCredential: vi.fn(),
}));

vi.mock('../services/aiService', () => ({ requestAi }));
vi.mock('../../../utils/aiCredentials', () => ({
  hasStoredGeminiCredential: () => false,
  refreshGeminiCredentialStatus,
  saveGeminiCredential,
  deleteGeminiCredential,
}));

import { useAI } from './useAI';

async function captureError<T>(action: () => Promise<T>) {
  try {
    return { value: await action(), error: undefined };
  } catch (cause) {
    return { value: undefined as T, error: cause as Error };
  }
}

describe('useAI', () => {
  beforeEach(() => {
    requestAi.mockReset();
    refreshGeminiCredentialStatus.mockReset();
    saveGeminiCredential.mockReset();
    deleteGeminiCredential.mockReset();
    requestAi.mockImplementation(async (request: () => Promise<unknown>) => request());
  });

  it('runs requests and surfaces structured errors', async () => {
    const { result } = renderHook(() => useAI());
    expect(result.current.configured).toBe(false);

    let value: unknown;
    await act(async () => {
      value = await result.current.run(async () => 'result');
    });
    expect(value).toBe('result');
    expect(result.current.loading).toBe(false);

    requestAi.mockRejectedValue(new Error('فشل التحليل'));
    let caught: Error | undefined;
    await act(async () => {
      ({ error: caught } = await captureError(() => result.current.run(async () => 'x')));
    });
    expect(caught?.message).toBe('فشل التحليل');
    await waitFor(() => expect(result.current.error?.message).toBe('فشل التحليل'));
  });

  it('refreshes, saves, and deletes the credential state', async () => {
    refreshGeminiCredentialStatus.mockResolvedValue(true);
    saveGeminiCredential.mockResolvedValue(undefined);
    deleteGeminiCredential.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAI());

    let refreshed: unknown;
    await act(async () => {
      refreshed = await result.current.refreshCredential();
    });
    expect(refreshed).toBe(true);
    await waitFor(() => expect(result.current.configured).toBe(true));

    await act(async () => result.current.saveCredential('secret'));
    await waitFor(() => expect(result.current.configured).toBe(true));
    expect(saveGeminiCredential).toHaveBeenCalledWith('secret');

    await act(async () => result.current.deleteCredential());
    await waitFor(() => expect(result.current.configured).toBe(false));
    expect(deleteGeminiCredential).toHaveBeenCalledOnce();
  });
});
