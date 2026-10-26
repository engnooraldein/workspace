import { handler, json } from "@/lib/api";
import { requireTenantAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOrderStatus, updateOrderStatus } from "@/lib/orders";
import { firstError, statusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Moves an order to its next status and pushes the change to the customer phone. */
export const POST = handler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);
  if (!isOrderStatus(parsed.data.status)) return json({ error: "INVALID_STATUS" }, 400);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return json({ error: "NOT_FOUND" }, 404);

  await requireTenantAccess(order.tenantId);

  const result = await updateOrderStatus(id, parsed.data.status);
  if (!result.ok) {
    const status = result.error === "NOT_FOUND" ? 404 : 409;
    return json({ error: result.error ?? "INVALID_TRANSITION" }, status);
  }

  return json({ ok: true, status: result.order?.status });
});
