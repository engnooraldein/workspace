"use server";

import { revalidatePath } from "next/cache";

import { requireTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { businessDateKey, isOrderStatus, updateOrderStatus } from "@/lib/orders";
import { firstError, createOrderSchema } from "@/lib/validation";

export type PosActionState = { ok?: boolean; error?: string; token?: string; number?: number };

/** Creates an order from the cashier screen and returns the issued tracking token. */
export async function createPosOrderAction(_prev: PosActionState, formData: FormData): Promise<PosActionState> {
  const branchId = String(formData.get("branchId") ?? "");
  if (!branchId) return { error: "MISSING_BRANCH" };

  const parsed = createOrderSchema.safeParse({
    branchId,
    number: formData.get("number") || undefined,
    tableNumber: formData.get("tableNumber") || undefined,
    itemsNote: formData.get("itemsNote") || undefined,
    totalAmount: formData.get("totalAmount") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const branch = await prisma.branch.findUnique({ where: { id: branchId }, include: { tenant: true } });
  if (!branch) return { error: "BRANCH_NOT_FOUND" };

  await requireTenantAccess(branch.tenantId);

  if (branch.tenant.subscriptionStatus !== "active") return { error: "TENANT_FROZEN" };

  const businessDate = businessDateKey();
  const duplicate = await prisma.order.findFirst({
    where: { branchId, businessDate, number: parsed.data.number },
    select: { id: true },
  });
  if (duplicate) return { error: "DUPLICATE_NUMBER" };

  const order = await prisma.order.create({
    data: {
      tenantId: branch.tenantId,
      branchId,
      number: parsed.data.number,
      businessDate,
      publicToken: crypto.randomUUID().replace(/-/g, ""),
      tableNumber: parsed.data.tableNumber ?? null,
      itemsNote: parsed.data.itemsNote ?? null,
      totalAmount: parsed.data.totalAmount ?? 0,
      status: "PREPARING",
      events: { create: { type: "CREATED", toStatus: "PREPARING" } },
    },
  });

  const { publishOrderEvent } = await import("@/lib/realtime");
  publishOrderEvent({
    type: "order.created",
    tenantId: order.tenantId,
    branchId: order.branchId,
    orderId: order.id,
    token: order.publicToken,
    number: order.number,
    status: "PREPARING",
  });

  revalidatePath(`/${branch.tenant.slug}/pos`);

  return { ok: true, token: order.publicToken, number: order.number };
}

/** Advances an order and notifies the customer device instantly. */
export async function setOrderStatusAction(
  orderId: string,
  status: string,
): Promise<PosActionState> {
  if (!isOrderStatus(status)) return { error: "INVALID_STATUS" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "NOT_FOUND" };

  await requireTenantAccess(order.tenantId);

  const result = await updateOrderStatus(orderId, status);
  if (!result.ok) return { error: result.error ?? "INVALID_TRANSITION" };

  return { ok: true };
}
