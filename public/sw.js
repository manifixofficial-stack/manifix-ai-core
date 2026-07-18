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
          return (
            cached || new Response('Network error and no cached copy available.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        });
        
      return cached || networkFetch;
    })
  );
});
