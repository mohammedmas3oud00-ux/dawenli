import { RepositoryError } from '../../data/repository';

export type ServiceErrorCode = 'validation' | 'unauthorized' | 'network' | 'conflict' | 'unknown';

export interface ServiceErrorShape {
  code: ServiceErrorCode;
  message: string;
  requestId: string;
  cause?: unknown;
}

export class ServiceError extends Error implements ServiceErrorShape {
  readonly requestId: string;

  constructor(
    public readonly code: ServiceErrorCode,
    message: string,
    requestId = crypto.randomUUID(),
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ServiceError';
    this.requestId = requestId;
  }
}

export function toServiceError(error: unknown, fallback = 'تعذر تنفيذ العملية.') {
  if (error instanceof ServiceError) return error;
  if (error instanceof RepositoryError) {
    return new ServiceError(
      error.code === 'not_configured' ? 'unknown' : error.code,
      error.message,
      crypto.randomUUID(),
      error,
    );
  }
  return new ServiceError('unknown', error instanceof Error ? error.message : fallback, crypto.randomUUID(), error);
}

/**
 * Converts any error into a clear Arabic user-facing message.
 * Network failures are detected before the raw English text is shown.
 */
export function describeError(error: unknown, fallback = 'تعذر تنفيذ العملية. حاول مرة أخرى.') {
  const message = error instanceof Error ? error.message : '';
  if (/failed to fetch|networkerror|network request failed|load failed|err_failed|typeerror: failed/i.test(message)) {
    return 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.';
  }
  if (/timeout|timed out|aborted/i.test(message)) return 'انتهت مهلة الطلب. حاول مرة أخرى.';
  if (/42501|permission denied|not authorized|unauthorized/i.test(message)) {
    return 'ليست لديك صلاحية لتنفيذ هذه العملية على هذا الحساب.';
  }
  if (/23505|already exists|already been registered|duplicate key/i.test(message)) {
    return 'هذا العنصر مسجّل بالفعل. استخدم قيمة مختلفة أو سجّل الدخول.';
  }
  if (/409|conflict/i.test(message)) return 'البيانات تغيّرت على جهاز آخر. أعد التحميل ثم حاول مرة أخرى.';
  if (/invalid login credentials/i.test(message)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحين.';
  if (/email not confirmed/i.test(message))
    return 'لم يتم تأكيد البريد الإلكتروني بعد. افتح رسالة التأكيد ثم أعد المحاولة.';
  if (/rate limit|too many requests/i.test(message)) return 'أرسلت طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.';
  if (/invalid.*email|email_address_invalid/i.test(message)) return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (/weak password|password should be at least/i.test(message)) {
    return 'كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مزيجًا من أحرف وأرقام ورموز.';
  }
  return message || (error instanceof Error ? fallback : fallback);
}
