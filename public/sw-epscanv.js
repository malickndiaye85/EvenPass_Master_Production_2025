const CACHE_VERSION = 'epscanv-v1.0.0';
const CRITICAL_CACHE = `${CACHE_VERSION}-critical`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const CRITICAL_RESOURCES = [
  '/controller/login',
  '/controller-epscanv',
  '/manifest-epscanv.json',
  '/epscan-512.png',
];

self.addEventListener('install', (event) => {
  console.log('[EPscanV SW] Installing service worker...');
  event.waitUntil(
    caches.open(CRITICAL_CACHE).then((cache) => {
      console.log('[EPscanV SW] Caching critical resources');
      return cache.addAll(CRITICAL_RESOURCES).catch(err => {
        console.warn('[EPscanV SW] Some resources failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[EPscanV SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('epscanv-') && name !== CRITICAL_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[EPscanV SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/controller') || url.pathname.includes('epscanv')) {
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[EPscanV SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline - No cached version available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[EPscanV SW] Failed to fetch:', request.url);
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[EPscanV SW] Skipping waiting...');
    self.skipWaiting();
  }
});
