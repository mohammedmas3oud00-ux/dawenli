import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({ auth: { getSession: vi.fn() } }));
vi.mock('./supabaseClient', () => ({ supabase: { auth } }));

import {
  getPushPreferences,
  subscribeToPush,
  unsubscribeFromPush,
  type PushNotificationPreferences,
} from './pushNotifications';

const validKey = (() => {
  const raw = Array.from({ length: 65 }, (_, index) => index % 251);
  return btoa(String.fromCharCode(...raw))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
})();

function mockPushEnvironment(subscriptionEndpoint = 'https://push.test/subscription') {
  const subscription = {
    endpoint: subscriptionEndpoint,
    unsubscribe: vi.fn().mockResolvedValue(undefined),
  };
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(subscription),
    subscribe: vi.fn().mockResolvedValue(subscription),
  };
  const registration = { pushManager };
  vi.stubGlobal('navigator', {
    serviceWorker: { ready: Promise.resolve(registration), getRegistration: vi.fn().mockResolvedValue(registration) },
  });
  vi.stubGlobal('PushManager', {});
  vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('granted') });
  return { subscription, pushManager };
}

describe('push notifications client', () => {
  beforeEach(() => {
    auth.getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'token-1' } } });
    vi.restoreAllMocks();
  });

  it('rejects subscription when the browser lacks push support', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('navigator', { serviceWorker: {} });
    await expect(subscribeToPush()).rejects.toThrow('لا يدعم');
  });

  it('rejects subscription when permission is denied', async () => {
    mockPushEnvironment();
    vi.stubGlobal('Notification', { requestPermission: vi.fn().mockResolvedValue('denied') });
    await expect(subscribeToPush()).rejects.toThrow('لم يتم منح إذن');
  });

  it('subscribes and stores preferences with the server key', async () => {
    const { subscription } = mockPushEnvironment();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { publicKey: validKey } }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const prayerTimes = { fajr: '04:30' };
    const options: PushNotificationPreferences = { prayerEnabled: true, taskEnabled: false };
    await subscribeToPush(prayerTimes, options);
    const body = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(body.subscription.endpoint).toBe(subscription.endpoint);
    expect(body.prayerTimes).toEqual(prayerTimes);
    expect(body.prayerEnabled).toBe(true);
    expect(body.taskEnabled).toBe(false);
    expect(body.worshipEnabled).toBeUndefined();
  });

  it('rejects an invalid application server key length', async () => {
    mockPushEnvironment();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { publicKey: btoa('abc') } }), { status: 200 }),
    );
    await expect(subscribeToPush()).rejects.toThrow('غير صالح');
  });

  it('unsubscribes locally even when the server delete fails', async () => {
    const { subscription } = mockPushEnvironment();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(unsubscribeFromPush()).rejects.toThrow('تعذر حذف');
    expect(subscription.unsubscribe).toHaveBeenCalledOnce();
  });

  it('returns null preferences without an active subscription', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: vi.fn().mockResolvedValue(null) } });
    vi.stubGlobal('PushManager', {});
    await expect(getPushPreferences()).resolves.toBeNull();
  });

  it('maps stored server preferences into client flags', async () => {
    mockPushEnvironment();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { prayer_enabled: false, task_enabled: true } }), { status: 200 }),
    );
    await expect(getPushPreferences()).resolves.toMatchObject({ prayerEnabled: false, taskEnabled: true });
  });
});
