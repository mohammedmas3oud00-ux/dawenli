import { toServiceError } from '../../../shared/services/repositoryErrors';

export async function requestAi<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw toServiceError(error, 'تعذر تنفيذ تحليل الذكاء الاصطناعي.');
  }
}
