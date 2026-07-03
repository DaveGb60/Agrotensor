/// <reference lib="webworker" />

import { cleanupOutdatedCaches, clientsClaim } from 'workbox-core';
import { precacheAndRoute, PrecacheEntry } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { PrecacheFallbackPlugin } from 'workbox-precaching';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST as PrecacheEntry[]);

const htmlFallback = '/offline.html';

const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'html-navigations',
    networkTimeoutSeconds: 4,
    expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new PrecacheFallbackPlugin({
        fallbackURL: htmlFallback,
      }),
    ],
  }),
  {
    denylist: [new RegExp('/~oauth')],
  }
);
registerRoute(navigationRoute);

registerRoute(
  ({ request, sameOrigin }) =>
    sameOrigin &&
    ['script', 'style', 'worker', 'font', 'image', 'manifest'].includes(request.destination),
  new CacheFirst({
    cacheName: 'static-assets',
    expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

const cloudSyncPlugin = new BackgroundSyncPlugin('cloud-sync', {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url }) =>
    url.origin.includes('supabase.co') ||
    url.origin.includes('vercel.app') ||
    /^https:\/\/[^/]+\/functions\/v1\//.test(url.href),
  new NetworkFirst({
    cacheName: 'cloud-api',
    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      cloudSyncPlugin,
    ],
  }),
  'POST'
);
