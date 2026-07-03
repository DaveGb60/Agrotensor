// Legacy one-release cleanup worker for any older app-shell service worker
// that may have been registered at /service-worker.js before the /sw.js setup.
// It now only unregisters itself and does not touch shared caches.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const windowClients = await self.clients.matchAll({ type: 'window' });
      await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      await self.registration.unregister();
    })(),
  ),
);
