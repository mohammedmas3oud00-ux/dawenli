import { useCallback, useState } from 'react';
import { runNotificationAction } from '../services/notificationService';
import { subscribeToPush, type PushNotificationPreferences } from '../../../utils/pushNotifications';

export function useNotifications() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const run = useCallback(async <T>(action: () => Promise<T>) => {
    setSaving(true);
    setError(null);
    try {
      return await runNotificationAction(action);
    } catch (cause) {
      const value = cause instanceof Error ? cause : new Error('تعذر تحديث الإشعارات.');
      setError(value);
      throw value;
    } finally {
      setSaving(false);
    }
  }, []);
  const subscribe = useCallback(
    (preferences: PushNotificationPreferences) => run(() => subscribeToPush({}, preferences)),
    [run],
  );
  return { saving, error, run, subscribe };
}
