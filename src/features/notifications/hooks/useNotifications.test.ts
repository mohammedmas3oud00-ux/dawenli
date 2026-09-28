import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications } from './useNotifications';

const { subscribeToPush } = vi.hoisted(() => ({ subscribeToPush: vi.fn() }));
vi.mock('../../../utils/pushNotifications', () => ({
  subscribeToPush,
  unsubscribeFromPush: vi.fn(),
  getPushPreferences: vi.fn(),
}));

async function captureError(action: () => Promise<unknown>) {
  try {
    await action();
    return undefined;
  } catch (cause) {
    return cause as Error;
  }
}

describe('useNotifications', () => {
  beforeEach(() => {
    subscribeToPush.mockReset();
  });

  it('tracks saving state and errors around push subscriptions', async () => {
    subscribeToPush.mockResolvedValue(undefined);
    const { result } = renderHook(() => useNotifications());
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();

    let resolved = false;
    await act(async () => {
      await result.current.subscribe({ prayerEnabled: true });
      resolved = true;
    });
    expect(resolved).toBe(true);
    expect(subscribeToPush).toHaveBeenCalledWith({}, { prayerEnabled: true });

    subscribeToPush.mockRejectedValue(new Error('غير مهيأة'));
    let caught: Error | undefined;
    await act(async () => {
      caught = await captureError(() => result.current.subscribe({}));
    });
    expect(caught?.message).toBe('غير مهيأة');
    await waitFor(() => expect(result.current.error?.message).toBe('غير مهيأة'));
    expect(result.current.saving).toBe(false);
  });

  it('normalizes non-error failures', async () => {
    subscribeToPush.mockRejectedValue('failure');
    const { result } = renderHook(() => useNotifications());
    let caught: Error | undefined;
    await act(async () => {
      caught = await captureError(() => result.current.subscribe({}));
    });
    expect(caught?.message).toBe('تعذر تحديث إعدادات الإشعارات.');
  });
});
