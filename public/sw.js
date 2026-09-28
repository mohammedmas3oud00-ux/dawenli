const CACHE_VERSION = 'v3';
const SHELL_CACHE = `dawenli-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `dawenli-runtime-${CACHE_VERSION}`;
const CACHE_PREFIX = 'dawenli-';
const MAX_RUNTIME_ENTRIES = 60;
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.svg', '/icons/icon-512.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

async function cacheSuccessfulResponse(cacheName, request, response) {
  if (!response?.ok || response.type === 'opaque') return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_RUNTIME_ENTRIES)).map((key) => cache.delete(key)));
}

function notificationUrl(value) {
  try {
    const url = new URL(typeof value === 'string' ? value : '/', self.location.origin);
    return url.origin === self.location.origin ? url.href : new URL('/', self.location.origin).href;
  } catch {
    return new URL('/', self.location.origin).href;
  }
}

function pushPayload(event) {
  if (!event.data) return {};
  try {
    const parsed = event.data.json();
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { body: event.data.text() };
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map((key) => caches.delete(key)))),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('push', (event) => {
  const data = pushPayload(event);
  event.waitUntil(
    self.registration.showNotification(typeof data.title === 'string' && data.title.trim() ? data.title : 'دوّنلي', {
      body: typeof data.body === 'string' ? data.body : 'لديك تنبيه جديد.',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      dir: 'rtl',
      lang: 'ar',
      data: { url: notificationUrl(data.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = notificationUrl(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      const target = windows.find((client) => client.url === targetUrl);
      if (target) return target.focus();
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          await cacheSuccessfulResponse(SHELL_CACHE, '/', response);
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/')) || Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      const network = fetch(request)
        .then(async (response) => {
          await cacheSuccessfulResponse(RUNTIME_CACHE, request, response);
          await trimRuntimeCache();
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    }),
  );
});
