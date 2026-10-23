// Service Worker for The Master's Discipleship Ministries (MDMI)
// Handles background push events, offline caching, and notification clicks for Web, Android, and iOS PWA

const CACHE_NAME = 'mdmi-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let data = {
    title: "The Master's Discipleship Ministries",
    body: "Today's devotional meditation is ready for you.",
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: 'mdmi-devotional-alert',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.svg',
    badge: data.badge || '/logo.svg',
    tag: data.tag || 'mdmi-general',
    data: data.data || { url: '/' },
    vibrate: [150, 100, 200],
    actions: [
      { action: 'read', title: 'Read Word' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle user clicking on the notification banner/popup
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';
  if (notifData.devotionalId) {
    targetUrl = `/?devotionalId=${encodeURIComponent(notifData.devotionalId)}`;
  } else if (notifData.notificationId || notifData.id) {
    targetUrl = `/?notificationId=${encodeURIComponent(notifData.notificationId || notifData.id)}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'MDMI_NOTIFICATION_CLICKED',
            data: notifData,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
