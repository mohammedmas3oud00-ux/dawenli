import { toServiceError } from '../../../shared/services/repositoryErrors';

export async function runNotificationAction<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toServiceError(error, 'تعذر تحديث إعدادات الإشعارات.');
  }
}
