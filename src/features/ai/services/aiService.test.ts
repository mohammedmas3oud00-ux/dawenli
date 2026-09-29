import { describe, expect, it, vi } from 'vitest';
import { requestAi } from './aiService';

describe('requestAi', () => {
  it('returns the request value', async () => {
    await expect(requestAi(async () => 'analysis')).resolves.toBe('analysis');
  });

  it('wraps failures into service errors with the AI fallback', async () => {
    await expect(
      requestAi(async () => {
        throw new Error('rate limited');
      }),
    ).rejects.toMatchObject({
      code: 'unknown',
      message: 'rate limited',
    });
  });

  it('keeps existing service error codes', async () => {
    const cause = vi.fn().mockRejectedValue(new Error('unauthorized'));
    await expect(requestAi(cause)).rejects.toBeInstanceOf(Error);
  });
});
