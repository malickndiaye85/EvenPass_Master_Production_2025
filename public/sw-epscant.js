const CACHE_NAME = 'epscant-transport-v1';
const TRANSPORT_SCOPE = '/epscant/';

const TRANSPORT_RESOURCES = [
  '/epscant-transport.html',
  '/epscant-login.html',
  '/manifest-epscant.json',
  '/assets/EPscanT_logo_pwa.jpg',
];

self.addEventListener('install', (event) => {
  console.log('[EPscanT SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(TRANSPORT_RESOURCES).catch((err) => {
        console.error('[EPscanT SW] Failed to cache transport resources:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[EPscanT SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('epscant-transport-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[EPscanT SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.includes('firebase') || url.pathname.includes('gstatic')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname.includes('epscant')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          return new Response('Offline - EPscanT', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
