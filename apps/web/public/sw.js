// Service Worker for Sard Platform Push & Background Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'إشعار جديد من منصة سرد 🔔',
    body: 'لديك إشعار جديد في حسابك.',
    icon: '/logo.png',
    badge: '/favicon.svg',
    tag: 'sard-notification',
    url: '/app/notifications',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || `sard-${Date.now()}`,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/app/notifications',
      time: Date.now(),
    },
    actions: [
      { action: 'open', title: 'عرض الآن' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/app/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
