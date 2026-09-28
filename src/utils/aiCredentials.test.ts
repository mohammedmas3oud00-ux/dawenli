import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({ auth: { getSession: vi.fn() } }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));

import {
  deleteGeminiCredential,
  hasStoredGeminiCredential,
  refreshGeminiCredentialStatus,
  saveGeminiCredential,
} from './aiCredentials';

describe('Gemini credential client boundary', () => {
  beforeEach(() => {
    auth.getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'token-1' } } });
    vi.restoreAllMocks();
  });

  it('requires a signed-in session', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(refreshGeminiCredentialStatus()).rejects.toThrow('سجّل الدخول');
  });

  it('reads, saves, and deletes credential state through the API', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { configured: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await expect(refreshGeminiCredentialStatus()).resolves.toBe(true);
    expect(hasStoredGeminiCredential()).toBe(true);
    await saveGeminiCredential('secret');
    await deleteGeminiCredential();
    expect(hasStoredGeminiCredential()).toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/ai/credential',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'secret' }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/ai/credential', expect.objectContaining({ method: 'DELETE' }));
  });

  it('maps non-json API failures to a safe error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('bad gateway', { status: 502, headers: { 'content-type': 'text/plain' } }),
    );
    await expect(refreshGeminiCredentialStatus()).rejects.toThrow('غير متاحة');
  });
});
