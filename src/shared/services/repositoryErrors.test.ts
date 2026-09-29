import { describe, expect, it } from 'vitest';
import { RepositoryError } from '../../data/repository';
import { ServiceError, describeError, toServiceError } from './repositoryErrors';

describe('toServiceError', () => {
  it('keeps existing service errors untouched', () => {
    const error = new ServiceError('conflict', 'تعارض');
    expect(toServiceError(error)).toBe(error);
  });

  it('maps repository errors and normalizes the not_configured code', () => {
    const mapped = toServiceError(new RepositoryError('unauthorized', 'غير مسموح'));
    expect(mapped.code).toBe('unauthorized');
    const unmapped = toServiceError(new RepositoryError('not_configured', 'غير مهيأ'));
    expect(unmapped.code).toBe('unknown');
    expect(unmapped.cause).toBeInstanceOf(RepositoryError);
  });

  it('falls back to a safe message for non-error values', () => {
    expect(toServiceError(undefined, 'احتياطي').message).toBe('احتياطي');
    expect(toServiceError(new Error('boom')).message).toBe('boom');
  });
});

describe('describeError', () => {
  it('translates network failures into a clear Arabic message', () => {
    expect(describeError(new Error('Failed to fetch'))).toContain('الاتصال بالخادم');
    expect(describeError(new Error('TypeError: Failed to fetch'))).toContain('الاتصال بالخادم');
    expect(describeError(new Error('NetworkError when attempting to fetch resource'))).toContain('الاتصال بالخادم');
  });

  it('translates auth, permission, and conflict cases', () => {
    expect(describeError(new Error('invalid login credentials'))).toContain('غير صحيحين');
    expect(describeError(new Error('Email not confirmed'))).toContain('تأكيد البريد');
    expect(describeError(new Error('permission denied for function'))).toContain('صلاحية');
    expect(describeError(new Error('duplicate key value violates unique constraint'))).toContain('مسجّل بالفعل');
  });

  it('keeps an Arabic source message and falls back safely', () => {
    expect(describeError(new Error('رسالة مخصصة'))).toBe('رسالة مخصصة');
    expect(describeError('not an error', 'رسالة احتياطية')).toBe('رسالة احتياطية');
  });
});
