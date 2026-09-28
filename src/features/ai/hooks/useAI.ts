import { useCallback, useState } from 'react';
import { requestAi } from '../services/aiService';
import {
  deleteGeminiCredential,
  hasStoredGeminiCredential,
  refreshGeminiCredentialStatus,
  saveGeminiCredential,
} from '../../../utils/aiCredentials';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [configured, setConfigured] = useState(() => hasStoredGeminiCredential());

  const run = useCallback(async <T>(request: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await requestAi(request);
    } catch (cause) {
      const value = cause instanceof Error ? cause : new Error('تعذر تنفيذ تحليل الذكاء الاصطناعي.');
      setError(value);
      throw value;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCredential = useCallback(async () => {
    const value = await run(refreshGeminiCredentialStatus);
    setConfigured(value);
    return value;
  }, [run]);

  const saveCredential = useCallback(
    async (value: string) => {
      await run(() => saveGeminiCredential(value));
      setConfigured(true);
    },
    [run],
  );

  const deleteCredential = useCallback(async () => {
    await run(deleteGeminiCredential);
    setConfigured(false);
  }, [run]);

  return { loading, error, configured, run, refreshCredential, saveCredential, deleteCredential };
}
