import { handler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { publishOrderEvent, type OrderStatus } from "@/lib/realtime";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

/**
 * Registers a customer device's Web Push Subscription for an order.
 * Enables lock-screen notifications even if the phone has left the browser.
 */
export const POST = handler(async (request: Request, { params }: Props) => {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    select: { id: true, number: true, tenantId: true, branchId: true, status: true, publicToken: true },
  });

  if (!order) {
    return new Response(JSON.stringify({ error: "ORDER_NOT_FOUND" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return new Response(JSON.stringify({ error: "INVALID_SUBSCRIPTION" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      orderId: order.id,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
    create: {
      orderId: order.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  });

  // Notify cashier screen in real-time that customer enabled lock-screen notifications
  publishOrderEvent({
    type: "order.status",
    tenantId: order.tenantId,
    branchId: order.branchId,
    orderId: order.id,
    token: order.publicToken,
    number: order.number,
    status: order.status as OrderStatus,
  });

  return new Response(JSON.stringify({ ok: true, orderNumber: order.number }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
