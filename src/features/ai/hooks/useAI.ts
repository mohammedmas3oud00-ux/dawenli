import { useCallback, useState } from 'react';
import { requestAi } from '../services/aiService';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const run = useCallback(async <T,>(request: () => Promise<T>) => {
    setLoading(true); setError(null);
    try { return await requestAi(request); }
    catch (cause) { const value = cause instanceof Error ? cause : new Error('تعذر تنفيذ تحليل الذكاء الاصطناعي.'); setError(value); throw value; }
    finally { setLoading(false); }
  }, []);
  return { loading, error, run };
}
