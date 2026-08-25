// Service worker mínimo: solo existe para que Chrome/Edge consideren
// la app "instalable". No cachea nada de forma agresiva, así que
// siempre verás la versión más reciente.
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
