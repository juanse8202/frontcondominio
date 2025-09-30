// public/sw.js
// IMPORTANTE: No referenciar rutas de /src en producción (Vite las compila a /assets/...)
// Si una de las URLs de precache falla, la instalación fallará y no se activará el SW => no aparece el prompt de instalación PWA.
// Mantén la lista corta y estable; el resto se cachéa dinámicamente.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `condominio-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png'
];

// Página fallback opcional para navegación offline (usamos index.html SPA)
const OFFLINE_FALLBACK = '/index.html';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // addAll falla si una URL no se puede cachear; usamos Promise.allSettled
      await Promise.allSettled(PRECACHE_URLS.map(u => cache.add(u)));
      self.skipWaiting();
    })()
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo manejar GET
  if (request.method !== 'GET') return;

  // Evitar interferir con API (deja que el navegador maneje directamente, así no rompemos CORS, redirects 301 ni auth)
  // Si quieres luego una estrategia offline para ciertas llamadas, haz una whitelist específica.
  if (request.url.includes('/api/')) {
    return; // No llamamos respondWith => pasa directo
  }

  // Estrategia para navegaciones (document) => Network falling back a cache y luego a OFFLINE_FALLBACK
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          // Evitar cachear respuestas de redireccionamiento u opacas
          if (networkResponse && networkResponse.ok && networkResponse.type !== 'opaqueredirect') {
            try {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse.clone());
            } catch (cacheErr) {
              console.warn('[SW] Error cacheando navigate response:', cacheErr);
            }
          } else if (networkResponse && (networkResponse.status === 301 || networkResponse.status === 302)) {
            console.info('[SW] Navegación con redirect (no cacheada):', networkResponse.status, networkResponse.headers.get('Location'));
          }
          return networkResponse;
        } catch (err) {
          const cacheMatch = await caches.match(request);
          if (cacheMatch) return cacheMatch;
          return caches.match(OFFLINE_FALLBACK);
        }
      })()
    );
    return;
  }

  // Para otros (CSS/JS/imágenes): network first con fallback a cache
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response) {
          if (response.status === 200 && response.type !== 'opaqueredirect') {
            try {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, response.clone());
            } catch (cErr) {
              console.warn('[SW] Error cacheando response:', cErr);
            }
          } else if (response.status === 301 || response.status === 302) {
            console.debug('[SW] Recurso con redirect (no cacheado):', request.url, '->', response.headers.get('Location'));
          }
        }
        return response;
      } catch (_) {
        const cacheMatch = await caches.match(request);
        if (cacheMatch) return cacheMatch;
        throw _; // deja que el navegador maneje si no hay cache
      }
    })()
  );
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications para comunicados
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    return;
  }
  
  // Procesar según el tipo de notificación
  if (data.type === 'comunicado') {
    const options = {
      body: data.mensaje || 'Nuevo comunicado disponible',
      icon: '/icons/icon-144x144.png',
      badge: '/icons/icon-144x144.png',
      tag: `comunicado-${data.id}`,
      data: {
        type: data.type,
        id: data.id,
        url: `/comunicados`
      },
      actions: [
        {
          action: 'view',
          title: 'Ver comunicado',
          icon: '/icons/icon-144x144.png'
        }
      ],
      vibrate: [200, 100, 200],
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(data.titulo || 'Nuevo Comunicado', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const data = event.notification.data;
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Si hay una ventana abierta, enfocarla y enviar mensaje
        for (const client of clientList) {
          if (client.url.includes(location.origin)) {
            client.focus();
            
            // Enviar mensaje para abrir comunicado específico
            if (data?.type === 'comunicado' && data.id) {
              client.postMessage({
                type: 'OPEN_COMUNICADO',
                id: data.id
              });
            }
            return client;
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        const targetUrl = data?.url || '/comunicados';
        return clients.openWindow(targetUrl);
      })
    );
  }
});