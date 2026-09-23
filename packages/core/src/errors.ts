/**
 * Application error with a stable, translatable code.
 * Codes are keys in the i18n `errors` namespace.
 */
export const ERROR_CODES = {
  UNAUTHORIZED: { status: 401 },
  FORBIDDEN: { status: 403 },
  NOT_FOUND: { status: 404 },
  VALIDATION_FAILED: { status: 422 },
  CONFLICT: { status: 409 },
  RATE_LIMITED: { status: 429 },
  INTERNAL: { status: 500 },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_CODES[code].status;
    this.details = details;
  }

  static notFound(message?: string, details?: unknown) {
    return new AppError("NOT_FOUND", message, details);
  }

  static unauthorized(message?: string, details?: unknown) {
    return new AppError("UNAUTHORIZED", message, details);
  }

  static forbidden(message?: string, details?: unknown) {
    return new AppError("FORBIDDEN", message, details);
  }

  static validationFailed(message?: string, details?: unknown) {
    return new AppError("VALIDATION_FAILED", message, details);
  }

  static conflict(message?: string, details?: unknown) {
    return new AppError("CONFLICT", message, details);
  }

  static internal(message?: string, details?: unknown) {
    return new AppError("INTERNAL", message, details);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
