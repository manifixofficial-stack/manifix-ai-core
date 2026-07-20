// ====================================================================
// ⚡ sw.js — THE Oms NATIVE OFFLINE MEMORY REFRESH CACHING ENGINE
// ====================================================================
// ✅ THE CACHE RESET FIX: Incremented to v5 to instantly blow away stale web files
const CACHE_VERSION = 'manifix-veggie-v5';
const CORE_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION)
        .map((key) => caches.delete(key)) // Destroys v4 data fragments immediately
    ))
  );
  self.clients.claim();
});

// Cache-first, stale-while-revalidate pattern:
// Serves instantly from local storage the moment a friend re-opens the link — true 0ms,
// even with zero bars in a basement. A fresh copy is fetched silently in the background
// so the NEXT load picks up any new deploy, without ever blocking the current one on the network.
//
// NEW: if the network fetch hard-fails (device offline, DNS/TLS failure,
// dead preview-deployment alias, aborted request, etc.) AND there's no
// cached copy of the exact requested URL, a page-navigation request
// (e.g. loading /?room=12344) now falls back to the cached app shell
// (/index.html) instead of a dead-end plain-text error response. This
// lets the SPA boot from cache and handle the ?room=... param client-side
// even when the network is completely unreachable. Non-navigation
// requests (scripts, styles, images, API calls) still get the old
// synthetic 503 fallback when nothing else is available — unchanged.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Never cache the realtime socket handshake — that always needs a live network hit.
  if (event.request.url.includes('/socket.io/') || event.request.url.includes('/ws')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch((err) => {
          console.warn('[sw] network fetch failed for', event.request.url, err);

          if (cached) return cached;

          // NEW: no exact-URL cache hit AND this is a page navigation
          // (e.g. the initial /?room=12344 load) — fall back to the
          // cached app shell so the SPA can still boot and read the
          // room code from location.search itself, instead of showing
          // a dead plain-text error page.
          if (event.request.mode === 'navigate') {
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
          }

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
