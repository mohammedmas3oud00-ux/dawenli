import { describe, expect, it } from 'vitest';
import { RepositoryError } from '../../data/repository';
import { ServiceError, toServiceError } from './repositoryErrors';

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
