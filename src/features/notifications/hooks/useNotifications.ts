import { useCallback, useState } from 'react';
import { runNotificationAction } from '../services/notificationService';

export function useNotifications() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setSaving(true); setError(null);
    try { return await runNotificationAction(action); }
    catch (cause) { const value = cause instanceof Error ? cause : new Error('تعذر تحديث الإشعارات.'); setError(value); throw value; }
    finally { setSaving(false); }
  }, []);
  return { saving, error, run };
}
