// Service Worker para PWA mejorado
const CACHE_NAME = 'fitness-app-v2';
const RUNTIME_CACHE = 'fitness-runtime-v2';
const API_CACHE = 'fitness-api-v2';

// Archivos estáticos para cachear (solo los que existen)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Intentar cachear archivos, pero no fallar si algunos no existen
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(() => {
              // Silenciar errores de archivos que no existen
              return null;
            })
          )
        );
      })
      .then(() => {
        // Activar inmediatamente el nuevo service worker
        return self.skipWaiting();
      })
      .catch(() => {
        // Continuar aunque haya errores
        self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Eliminar caches antiguos
            return cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE && 
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      // Tomar control de todas las páginas
      return self.clients.claim();
    })
  );
});

// Estrategia de cache mejorada: Stale-While-Revalidate para APIs
self.addEventListener('fetch', (event) => {
  // Ignorar requests que no son GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Para APIs, usar stale-while-revalidate
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Fetch en background para actualizar cache
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Solo cachear respuestas exitosas
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Si falla la red, devolver cached si existe
            return cachedResponse || new Response(
              JSON.stringify({ error: 'Sin conexión' }), 
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });

          // Devolver cached inmediatamente si existe, sino esperar network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Para recursos estáticos, usar cache first
  if (event.request.url.match(/\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          // Cachear la respuesta para futuras requests
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Para HTML y otros recursos, usar network first con fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, cachearla
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no hay cache, devolver página offline
          return caches.match('/index.html');
        });
      })
  );
});

// Manejo de mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (preparado para futuro)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    tag: 'fitness-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Fitness App', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/')
  );
});

