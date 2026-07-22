// ====================================================================
// ⚡ sw.js — Offline caching engine (FIXED)
// ====================================================================
// ✅ CACHE RESET: bump this string on every deploy that changes cached
// core assets, so old clients drop stale files immediately.
const CACHE_VERSION = 'manifix-veggie-v7';
const CORE_ASSETS = ['/', '/index.html'];

// --------------------------------------------------------------------
// INSTALL
// --------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch((err) => {
        console.warn('[sw] pre-cache failed during install, continuing anyway', err);
      })
  );
  self.skipWaiting();
});

// --------------------------------------------------------------------
// ACTIVATE
// --------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// --------------------------------------------------------------------
// FETCH
// --------------------------------------------------------------------
// FIX (this revision): "Response body is already used" race condition.
// response.clone() MUST happen synchronously, the instant the response
// object is received — never inside a nested .then() that depends on
// another async operation (like caches.open()) resolving first. If
// clone() is deferred behind any await/async gap, whoever the original
// response was returned to (the browser navigating, or a page fetch())
// may already start reading/consuming the body before the deferred
// clone() call runs — and clone() throws once the body stream has
// started. Both handlers below now clone immediately on arrival, store
// the clone in a local const, and only reference that const inside any
// later async .then() chain — the original `response` is returned
// untouched and is never raced against its own clone.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache the realtime socket handshake — that always needs a
  // live network hit.
  if (event.request.url.includes('/socket.io/') || event.request.url.includes('/ws')) {
    return;
  }

  // ---- Navigation requests: NETWORK-FIRST ----
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            // Clone RIGHT NOW, before any async work (caches.open) has
            // a chance to let the original response's body start being
            // read elsewhere. This is the actual fix for the race.
            const responseToCache = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                console.warn('[sw] failed to cache navigation response', event.request.url, err);
              });
            });
          }
          return response;
        })
        .catch((err) => {
          console.warn('[sw] navigation fetch failed for', event.request.url, err);
          return caches.match('/index.html').then((shell) => {
            return shell || new Response(
              'Network error and no cached copy available.',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' },
              }
            );
          });
        })
    );
    return;
  }

  // ---- Everything else (scripts, styles, images, API calls):
  // cache-first, stale-while-revalidate. ----
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            // Same rule as above: clone immediately on arrival, before
            // anything else touches the body. `cache` is already
            // resolved here so this was less likely to race in
            // practice, but keeping the pattern identical everywhere
            // removes the class of bug entirely rather than relying on
            // timing being "usually fine."
            const responseToCache = response.clone();
            cache.put(event.request, responseToCache).catch((err) => {
              console.warn('[sw] failed to cache asset', event.request.url, err);
            });
          }
          return response;
        })
        .catch((err) => {
          console.warn('[sw] network fetch failed for', event.request.url, err);
          if (cached) return cached;
          return new Response('Network error and no cached copy available.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      return cached || networkFetch;
    })
  );
});
