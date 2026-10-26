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

  const registerWithBackend = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidPublicKey && registration.pushManager) {
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        const res = await fetch(`/api/public/orders/${token}/push-subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        if (res.ok) {
          setSubscribed(true);
          return true;
        }
      }
      setSubscribed(true);
      return true;
    } catch (err) {
      console.warn("Push subscription sync:", err);
      setSubscribed(true);
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setSupported(true);
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        void registerWithBackend();
      }
    }
  }, [registerWithBackend]);

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

      // 2. Register & sync subscription with backend
      await registerWithBackend();

      // 3. Fire immediate confirmation test notification
      const registration = await navigator.serviceWorker.ready;
      const initialOptions: NotificationOptions & Record<string, unknown> = {
        body: `تم تفعيل جرس التنبيه بنجاح 🔔 طلبك قيد التحضير وسنرسل لك رنيناً فور جهوزه!`,
        icon: "/icon.svg",
        badge: "/icon.svg",
        tag: `order-${token}`,
        renotify: true,
        vibrate: [300, 150, 300],
        data: { url: window.location.href },
      };
      await registration.showNotification(`${restaurantName} — طلب #${orderNumber}`, initialOptions as NotificationOptions);

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Failed to enable notifications:", err);
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [supported, registerWithBackend, token, orderNumber, restaurantName]);

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
