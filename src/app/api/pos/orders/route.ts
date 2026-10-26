import { handler, json } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrder, businessDateKey, suggestOrderNumber } from "@/lib/orders";
import { firstError, createOrderSchema } from "@/lib/validation";
import type { PosOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Lists the active queue (or today's archive) for a branch. */
export const GET = handler(async (request: Request) => {
  const session = await getSession();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  const url = new URL(request.url);
  const branchId = url.searchParams.get("branchId") ?? session.branchId ?? "";
  const scope = url.searchParams.get("scope") ?? "active";

  if (!branchId) return json({ error: "MISSING_BRANCH" }, 400);
  if (session.role !== "SUPER_ADMIN" && session.branchId !== branchId) {
    return json({ error: "FORBIDDEN" }, 403);
  }

  const orders = await prisma.order.findMany({
    where:
      scope === "today"
        ? { branchId, businessDate: businessDateKey() }
        : { branchId, status: { in: ["PREPARING", "READY"] } },
    include: {
      _count: {
        select: { pushSubscriptions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const payload: PosOrder[] = orders.map((order) => ({
    id: order.id,
    token: order.publicToken,
    number: order.number,
    status: order.status as PosOrder["status"],
    tableNumber: order.tableNumber,
    itemsNote: order.itemsNote,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    readyAt: order.readyAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    branchId: order.branchId,
    pushCount: order._count.pushSubscriptions,
  }));

  return json({ orders: payload, suggestedNumber: await suggestOrderNumber(branchId, businessDateKey()) });
});

/** Creates a new order and issues its tracking token. */
export const POST = handler(async (request: Request) => {
  const session = await getSession();
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);

  const { branchId, number, tableNumber, itemsNote, totalAmount } = parsed.data;

  const branch = await prisma.branch.findUnique({ where: { id: branchId }, include: { tenant: true } });
  if (!branch) return json({ error: "BRANCH_NOT_FOUND" }, 404);

  if (session.role !== "SUPER_ADMIN" && session.tenantId !== branch.tenantId) {
    return json({ error: "FORBIDDEN" }, 403);
  }

  if (branch.tenant.subscriptionStatus !== "active") {
    return json({ error: "TENANT_FROZEN" }, 403);
  }

  const businessDate = businessDateKey();
  const duplicate = await prisma.order.findFirst({
    where: { branchId, businessDate, number },
    select: { id: true },
  });
  if (duplicate) return json({ error: "DUPLICATE_NUMBER" }, 409);

  const order = await createOrder({
    tenantId: branch.tenantId,
    branchId,
    number,
    tableNumber: tableNumber ?? null,
    itemsNote: itemsNote ?? null,
    totalAmount: totalAmount ?? 0,
  });

  return json({ ok: true, order: { id: order.id, token: order.publicToken, number: order.number } }, 201);
});
