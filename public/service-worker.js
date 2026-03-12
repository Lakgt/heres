const CACHE_NAME = 'heres-cache-v2';
const urlsToCache = [
  '/manifest.json',
  '/logo-white.png',
  '/logo-black.png',
  '/favicon.svg',
  '/logos/inj.png',
  '/logos/injective.svg',
  '/logos/chainlink.svg',
  '/logos/walletconnect.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const requests = await Promise.allSettled(
        urlsToCache.map(async (url) => {
          const response = await fetch(url, { cache: 'no-cache' });
          if (!response.ok) {
            throw new Error(`Failed to cache ${url}: ${response.status}`);
          }
          await cache.put(url, response);
        })
      );

      requests.forEach((result) => {
        if (result.status === 'rejected') {
          console.warn('[service-worker] cache warmup skipped:', result.reason);
        }
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document';
  const isNextData = url.pathname.startsWith('/_next') || url.searchParams.has('rsc');
  if (isDocument || isNextData) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
