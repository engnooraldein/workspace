import webpush from "web-push";
import { prisma } from "./db";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:support@smartbuzzer.app";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type OrderNotificationPayload = {
  title: string;
  body: string;
  status: string;
  url: string;
  tag?: string;
  icon?: string;
};

/**
 * Sends a Web Push notification to all subscribed devices for a specific order.
 * This triggers on the phone's lock screen even if the browser has been closed.
 */
export async function sendOrderPushNotification(
  orderId: string,
  payload: OrderNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not configured, skipping web push");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { orderId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const notificationString = JSON.stringify(payload);

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, notificationString);
      sent += 1;
    } catch (err: unknown) {
      failed += 1;
      const statusCode = (err as { statusCode?: number })?.statusCode;
      // 404 or 410 means subscription is expired or unsubscribed
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return { sent, failed };
}
