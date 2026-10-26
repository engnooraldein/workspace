import { randomUUID } from "node:crypto";

import { prisma } from "./db";
import { publishOrderEvent, type OrderStatus } from "./realtime";

export const ORDER_STATUSES: OrderStatus[] = ["PREPARING", "READY", "COMPLETED", "CANCELLED"];

/** Allowed status transitions — guards against nonsense transitions. */
export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const STATUS_LABELS: Record<OrderStatus, { ar: string; en: string }> = {
  PREPARING: { ar: "قيد التحضير", en: "Preparing" },
  READY: { ar: "جاهز للاستلام", en: "Ready" },
  COMPLETED: { ar: "تم التسليم", en: "Completed" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}

/** Business day in Iraq local time (Asia/Baghdad) so numbering resets at midnight there. */
export function businessDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function buildTrackingUrl(slug: string, token: string, customBase?: string): string {
  let base = customBase;
  if (!base) {
    if (process.env.PUBLIC_APP_URL && !process.env.PUBLIC_APP_URL.includes("localhost")) {
      base = process.env.PUBLIC_APP_URL;
    } else if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
      base = process.env.NEXT_PUBLIC_APP_URL;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      base = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      base = `https://${process.env.VERCEL_URL}`;
    } else if (typeof window !== "undefined" && window.location.origin) {
      base = window.location.origin;
    } else {
      base = process.env.PUBLIC_APP_URL || "https://smart-buzzer-three.vercel.app";
    }
  }
  base = base.replace(/\/+$/, "");
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  return `${base}/${slug}/track?order=${token}`;
}

/** Suggests the next free order number for a branch on a given business day. */
export async function suggestOrderNumber(branchId: string, businessDate: string): Promise<number> {
  const last = await prisma.order.findFirst({
    where: { branchId, businessDate },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

export type CreateOrderInput = {
  tenantId: string;
  branchId: string;
  number: number;
  tableNumber?: string | null;
  itemsNote?: string | null;
  totalAmount?: number;
};

/**
 * Creates an order and emits an `order.created` realtime event.
 * Throws when the number is already used for this branch today.
 */
export async function createOrder(input: CreateOrderInput) {
  const businessDate = businessDateKey();
  const token = randomUUID().replace(/-/g, "");

  const order = await prisma.order.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      number: input.number,
      businessDate,
      publicToken: token,
      tableNumber: input.tableNumber ?? null,
      itemsNote: input.itemsNote ?? null,
      totalAmount: input.totalAmount ?? 0,
      status: "PREPARING",
      events: {
        create: {
          type: "CREATED",
          toStatus: "PREPARING",
          payload: JSON.stringify({ number: input.number, businessDate }),
        },
      },
    },
  });

  publishOrderEvent({
    type: "order.created",
    tenantId: order.tenantId,
    branchId: order.branchId,
    orderId: order.id,
    token: order.publicToken,
    number: order.number,
    status: order.status as OrderStatus,
  });

  return order;
}

/**
 * Updates the status of an order and notifies every subscribed device.
 * Returns the updated order, or null when the transition is not allowed.
 */
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<{ ok: boolean; order?: Awaited<ReturnType<typeof prisma.order.findUnique>>; error?: string }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "NOT_FOUND" };

  const current = order.status as OrderStatus;
  if (current === nextStatus) return { ok: true, order };
  if (!STATUS_FLOW[current]?.includes(nextStatus)) {
    return { ok: false, error: `INVALID_TRANSITION:${current}->${nextStatus}` };
  }

  const now = new Date();
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      readyAt: nextStatus === "READY" ? now : order.readyAt,
      completedAt: nextStatus === "COMPLETED" ? now : order.completedAt,
      events: {
        create: {
          type: "STATUS_CHANGED",
          fromStatus: current,
          toStatus: nextStatus,
        },
      },
    },
  });

  publishOrderEvent({
    type: "order.status",
    tenantId: updated.tenantId,
    branchId: updated.branchId,
    orderId: updated.id,
    token: updated.publicToken,
    number: updated.number,
    status: nextStatus,
  });

  if (nextStatus === "READY") {
    const { sendOrderPushNotification } = await import("./push");
    const tenant = await prisma.tenant.findUnique({
      where: { id: updated.tenantId },
      select: { name: true, slug: true },
    });
    void sendOrderPushNotification(updated.id, {
      title: `🔔 طلبك جاهز للاستلام! (#${updated.number})`,
      body: `تفضل إلى الكاونتر لاستلام طلبك من ${tenant?.name ?? "المطعم"}`,
      status: "READY",
      url: buildTrackingUrl(tenant?.slug ?? "", updated.publicToken),
      tag: `order-${updated.publicToken}`,
    });
  }

  return { ok: true, order: updated };
}

/** Average preparation time in minutes for a set of orders (ready -> completed). */
export function averagePrepMinutes(
  orders: { createdAt: Date; readyAt: Date | null; completedAt: Date | null }[],
): number {
  const durations = orders
    .filter((order) => order.readyAt)
    .map((order) => (order.readyAt!.getTime() - order.createdAt.getTime()) / 60000)
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);

  if (durations.length === 0) return 0;
  const total = durations.reduce((sum, minutes) => sum + minutes, 0);
  return Math.round(total / durations.length);
}
