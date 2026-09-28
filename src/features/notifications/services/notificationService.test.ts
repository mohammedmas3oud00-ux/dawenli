import { describe, expect, it, vi } from 'vitest';
import { runNotificationAction } from './notificationService';

describe('runNotificationAction', () => {
  it('returns the action value', async () => {
    await expect(runNotificationAction(async () => 'ok')).resolves.toBe('ok');
  });

  it('wraps failures into service errors', async () => {
    await expect(
      runNotificationAction(async () => {
        throw new Error('boom');
      }),
    ).rejects.toMatchObject({
      code: 'unknown',
      message: 'boom',
    });
  });

  it('uses the fallback message for non-error rejections', async () => {
    const cause = vi.fn().mockRejectedValue('failure');
    await expect(runNotificationAction(cause)).rejects.toThrow('تعذر تحديث إعدادات الإشعارات');
  });
});
