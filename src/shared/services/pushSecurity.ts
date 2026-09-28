const allowedPushHosts = new Set([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'web.push.apple.com',
]);

export function isValidTimeZone(value: string): boolean {
  if (!value || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function isAllowedPushEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 16 || value.length > 4096) return false;
  try {
    const endpoint = new URL(value);
    if (
      endpoint.protocol !== 'https:' ||
      endpoint.username ||
      endpoint.password ||
      (endpoint.port && endpoint.port !== '443')
    )
      return false;
    const host = endpoint.hostname.toLowerCase();
    return allowedPushHosts.has(host) || host.endsWith('.push.apple.com') || host.endsWith('.notify.windows.com');
  } catch {
    return false;
  }
}

export function isValidPushKey(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 16 && value.length <= 512 && /^[A-Za-z0-9_-]+$/.test(value);
}
