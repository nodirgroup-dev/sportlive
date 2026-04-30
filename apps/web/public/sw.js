// sportlive.uz service worker — only handles push and notification clicks.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Sportlive', body: event.data.text() };
  }
  const title = payload.title || 'Sportlive';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: '/icon-badge.png',
    image: payload.image || undefined,
    tag: payload.tag || 'sportlive',
    data: { url: payload.url || '/' },
    actions: payload.actions || undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const c of clientsArr) {
        if ('focus' in c) {
          c.navigate(url).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
