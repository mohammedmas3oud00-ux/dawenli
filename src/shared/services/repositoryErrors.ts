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
    return new ServiceError(error.code === 'not_configured' ? 'unknown' : error.code, error.message, crypto.randomUUID(), error);
  }
  return new ServiceError('unknown', error instanceof Error ? error.message : fallback, crypto.randomUUID(), error);
}
