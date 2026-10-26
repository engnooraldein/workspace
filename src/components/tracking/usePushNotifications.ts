"use client";

import { useEffect, useState, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

export function usePushNotifications(token: string, orderNumber: number, restaurantName: string) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setSupported(true);
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        setSubscribed(true);
      }
    }
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!supported) return false;

    setSubscribing(true);
    try {
      // 1. Request Browser & System Permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setSubscribing(false);
        return false;
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // 3. Subscribe to Web Push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidPublicKey && registration.pushManager) {
        try {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          // 4. Send subscription to our backend
          await fetch(`/api/public/orders/${token}/push-subscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription),
          });
        } catch (pushErr) {
          console.warn("PushManager subscribe warning (local notifications will still work):", pushErr);
        }
      }

      // 5. Fire immediate confirmation notification (like Talabat live tracking)
      const initialOptions: NotificationOptions & Record<string, unknown> = {
        body: `تم تفعيل التنبيهات بنجاح 🔔 طلبك قيد التحضير وسنرسل لك إشعاراً فور جهوزه!`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: `order-${token}`,
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: window.location.href },
      };
      await registration.showNotification(`${restaurantName} — طلب #${orderNumber}`, initialOptions as NotificationOptions);

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Failed to enable notifications:", err);
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [supported, token, orderNumber, restaurantName]);

  // Trigger local notification via Service Worker if status changes to READY
  const notifyReady = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || Notification.permission !== "granted") {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const readyOptions: NotificationOptions & Record<string, unknown> = {
        body: `تفضل إلى الكاونتر لاستلام طلبك من ${restaurantName} 🍔✨`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: `order-${token}`,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 150, 300, 150, 600, 200, 600],
        data: { url: window.location.href },
      };
      await reg.showNotification(`🔔 طلبك #${orderNumber} جاهز للاستلام!`, readyOptions as NotificationOptions);
    } catch (err) {
      console.error("Failed to show ready notification:", err);
    }
  }, [orderNumber, restaurantName, token]);

  return {
    supported,
    permission,
    subscribing,
    subscribed,
    enableNotifications,
    notifyReady,
  };
}
