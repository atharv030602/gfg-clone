// Service Worker for GeeksforGeeks Clone
// Update CACHE_NAME when changing cached assets to force refresh.
const CACHE_NAME = 'gfg-clone-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/ai-chatbot.js',
  '/courses.html',
  '/practice.html',
  '/interview.html',
  '/jobs.html',
  '/write.html',
  '/login.html',
  '/dashboard.html',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline, but favor network for scripts/styles
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  // For navigation requests and HTML pages, use network-first strategy
  if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // For CSS/JS/images, use cache-first strategy
  if (requestUrl.pathname.endsWith('.css') || requestUrl.pathname.endsWith('.js') || requestUrl.pathname.endsWith('.png') || requestUrl.pathname.endsWith('.svg')) {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request).then(function(networkResponse) {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => response);
      })
    );
    return;
  }

  // Default strategy: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle any pending offline actions
  return new Promise((resolve) => {
    console.log('Background sync performed');
    resolve();
  });
}

// Push notifications
self.addEventListener('push', function(event) {
  const options = {
    body: 'New content available on GeeksforGeeks Clone!',
    icon: '/manifest-icon-192.png',
    badge: '/manifest-icon-96.png'
  };

  event.waitUntil(
    self.registration.showNotification('GFG Clone Update', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});