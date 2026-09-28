import { describe, expect, it } from 'vitest';
import { isAllowedPushEndpoint, isValidPushKey, isValidTimeZone } from './pushSecurity';

describe('push security boundary', () => {
  it('accepts supported Web Push service endpoints', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/token')).toBe(true);
    expect(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/token')).toBe(true);
    expect(isAllowedPushEndpoint('https://web.push.apple.com/QP/token')).toBe(true);
    expect(isAllowedPushEndpoint('https://wns2-db5p.notify.windows.com/w/token')).toBe(true);
  });

  it('rejects endpoints that could target arbitrary or internal services', () => {
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/token')).toBe(false);
    expect(isAllowedPushEndpoint('https://localhost/push')).toBe(false);
    expect(isAllowedPushEndpoint('https://127.0.0.1/push')).toBe(false);
    expect(isAllowedPushEndpoint('https://user:pass@fcm.googleapis.com/push')).toBe(false);
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com:8443/push')).toBe(false);
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com.example.com/push')).toBe(false);
  });

  it('validates IANA timezones and push encryption keys', () => {
    expect(isValidTimeZone('Africa/Cairo')).toBe(true);
    expect(isValidTimeZone('Not/A-Timezone')).toBe(false);
    expect(isValidPushKey('Abcdefghijklmnop_123-456')).toBe(true);
    expect(isValidPushKey('short')).toBe(false);
    expect(isValidPushKey('bad key with spaces')).toBe(false);
  });
});
