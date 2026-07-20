// ====================================================================
// ⚡ sw.js — Offline caching engine (FIXED)
// ====================================================================
// ✅ CACHE RESET: bump this string on every deploy that changes cached
// core assets, so old clients drop stale files immediately.
const CACHE_VERSION = 'manifix-veggie-v6';
const CORE_ASSETS = ['/', '/index.html'];

// --------------------------------------------------------------------
// INSTALL
// --------------------------------------------------------------------
// FIX: previously, if the network was flaky/returned a 503 during
// cache.addAll(), the whole install step REJECTED — which means the
// service worker never activated at all, and the browser silently kept
// running whatever OLD service worker + OLD cached JS/HTML it already
// had (potentially forever, since a failed install never gets retried
// until the browser decides to check again). That's what was causing
// stale/mismatched JS to be served with dead button handlers.
// Now a failed pre-cache is caught and logged instead of aborting
// install — the SW still activates, it just starts with an empty (or
// partially-empty) cache, which the network-first navigation handler
// below will fill in on the very next successful page load anyway.
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
        .map((key) => caches.delete(key)) // destroy old-version cache entries immediately
    ))
  );
  self.clients.claim();
});

// --------------------------------------------------------------------
// FETCH
// --------------------------------------------------------------------
// FIX: page navigations (the actual HTML document — e.g. loading
// "/" or "/?room=12344") are now NETWORK-FIRST instead of cache-first.
// This is the core fix for "buttons do nothing": previously, if ANY
// cached copy of "/" existed, it was served instantly even when a
// newer deploy was live — so you could be looking at old HTML/JS
// referencing stale bundle hashes while the actual server had already
// moved on, causing event handlers to silently fail to attach or point
// at code that no longer matches what's rendered.
//
// Non-navigation requests (JS/CSS/image assets, API calls) KEEP the
// original cache-first / stale-while-revalidate behavior — that part
// was never the problem and cache-first is exactly what you want for
// versioned static assets.
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
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch((err) => {
          console.warn('[sw] navigation fetch failed for', event.request.url, err);
          // Offline / server unreachable — fall back to whatever
          // cached shell we have so the SPA can still boot and read
          // ?room=... client-side, instead of a dead-end error page.
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
  // cache-first, stale-while-revalidate — UNCHANGED from before. ----
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
