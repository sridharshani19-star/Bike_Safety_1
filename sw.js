/* ==================================================================
   We Care, We Alert  —  Service Worker
   Version 3.  Network-first so the app is never stale.
   ================================================================== */

const VERSION = 'wcwa-v3';

/* Take over immediately instead of waiting for old tabs to close */
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

/* On activation, delete every cache from every previous version.
   This is what stops an old build living on the phone forever. */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.map(function (n) {
          return caches.delete(n);
        }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/* Always go to the network first. Only fall back to cache if the
   network genuinely fails, so a fresh build is picked up instantly. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        const copy = res.clone();
        caches.open(VERSION).then(function (c) {
          c.put(e.request, copy);
        });
        return res;
      })
      .catch(function () {
        return caches.match(e.request);
      })
  );
});

/* Tapping a notification focuses the app instead of opening a new tab */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        for (let i = 0; i < list.length; i++) {
          if ('focus' in list[i]) return list[i].focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow('./index.html');
      })
  );
});

/* Lets the page ask the worker to step aside for a new version */
self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
