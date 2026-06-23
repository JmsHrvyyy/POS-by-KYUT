const CACHE_NAME = "pos-by-kyut-cache-v1";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json",
  "/icons.svg"
];

// Install event: pre-cache critical shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: handle offline caching strategies
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Do not intercept Firestore/Firebase requests or non-GET requests
  if (
    request.method !== "GET" ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebaseinstallations.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com")
  ) {
    return;
  }

  // Network-First for HTML/document requests (always fetch latest, fallback to cache when offline)
  if (
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response and save to cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, serve from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback if not in cache (e.g. index.html is precached as "/")
            return caches.match("/");
          });
        })
    );
    return;
  }

  // Cache-First for static assets (js, css, images, fonts)
  // These are usually hashed in Vite and therefore immutable
  const isStaticAsset =
    url.pathname.includes("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== "basic" && response.type !== "cors") {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        }).catch((err) => {
          console.warn("Fetch failed for static asset:", request.url, err);
          // Just return cache match if anything fails
          return caches.match(request);
        });
      })
    );
    return;
  }

  // Default Stale-While-Revalidate or simple Network-First for other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silent catch for network failure
      });

      return cachedResponse || fetchPromise;
    })
  );
});
