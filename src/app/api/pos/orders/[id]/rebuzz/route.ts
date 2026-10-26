import { handler, json } from "@/lib/api";
import { requireTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOrderPushNotification } from "@/lib/push";
import { buildTrackingUrl } from "@/lib/orders";
import { publishOrderEvent, type OrderStatus } from "@/lib/realtime";

export const dynamic = "force-dynamic";

/**
 * Re-buzzes an order that is in READY status.
 * Sends another high-priority Web Push alert to the customer's phone
 * and triggers immediate sound + vibration if the customer has the tracking page open.
 */
export const POST = handler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      _count: { select: { pushSubscriptions: true } },
    },
  });

  if (!order) return json({ error: "NOT_FOUND" }, 404);
  await requireTenantAccess(order.tenantId);

  if (order.status !== "READY") {
    return json({ error: "ORDER_NOT_READY" }, 400);
  }

  // 1. Send push notification to lock screen with buzzing title
  await sendOrderPushNotification(order.id, {
    title: `🚨 تذكير عاجل: طلبك جاهز! (#${order.number})`,
    body: `يرجى التوجه إلى الكاونتر لاستلام طلبك من ${order.tenant.name}`,
    status: "READY",
    url: buildTrackingUrl(order.tenant.slug, order.publicToken),
    tag: `order-${order.publicToken}-${Date.now()}`,
  });

  // 2. Publish realtime event to trigger buzzer audio and vibration on client screen
  publishOrderEvent({
    type: "order.rebuzz",
    tenantId: order.tenantId,
    branchId: order.branchId,
    orderId: order.id,
    token: order.publicToken,
    number: order.number,
    status: order.status as OrderStatus,
  });

  return json({
    ok: true,
    orderNumber: order.number,
    pushDelivered: order._count.pushSubscriptions > 0,
    pushCount: order._count.pushSubscriptions,
    rebuzzedAt: new Date().toISOString(),
  });
});
