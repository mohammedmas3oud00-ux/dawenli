import { useCallback, useEffect, useState } from 'react';

export function useRepositoryQuery<T>(load: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const retry = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await load()); } catch (cause) { setError(cause instanceof Error ? cause : new Error('تعذر تحميل البيانات.')); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => { if (enabled) void retry(); else { setLoading(false); setData(null); } }, [enabled, retry]);
  return { data, loading, error, retry };
}
