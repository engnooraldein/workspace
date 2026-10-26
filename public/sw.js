/* eslint-disable no-restricted-globals */
// Smart Buzzer Service Worker for Background & Lock-Screen Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// -----------------------------------------------------------------------------
// Web Push event (fired by server when cashier marks order READY, even if tab closed)
// -----------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "نظام النداء الذكي";
    const options = {
      body: payload.body || "تحديث جديد على حالة طلبك",
      icon: payload.icon || "/icon.svg",
      badge: payload.badge || "/icon.svg",
      tag: payload.tag || "smart-buzzer-order",
      renotify: true,
      requireInteraction: payload.status === "READY", // Keep on screen if ready!
      vibrate: [300, 150, 300, 150, 600, 200, 600],
      data: {
        url: payload.url || "/",
        orderId: payload.orderId,
      },
      actions: [
        {
          action: "open-order",
          title: "عرض الطلب (View Order)",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("Failed to parse push event payload", err);
  }
});

// -----------------------------------------------------------------------------
// Notification Click event (opens or focuses the customer's tracking screen)
// -----------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
