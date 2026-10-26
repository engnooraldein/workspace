import { handler, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { firstError, ratingSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Stores the customer's 5-star rating + optional note for a finished order. */
export const POST = handler(async (request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);

  const order = await prisma.order.findUnique({ where: { publicToken: token }, include: { rating: true } });
  if (!order) return json({ error: "NOT_FOUND" }, 404);

  if (order.status !== "COMPLETED") {
    return json({ error: "ORDER_NOT_COMPLETED" }, 409);
  }

  if (order.rating) {
    return json({ ok: true, rating: { stars: order.rating.stars, note: order.rating.note } });
  }

  const rating = await prisma.rating.create({
    data: {
      orderId: order.id,
      stars: parsed.data.stars,
      note: parsed.data.note ?? null,
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      type: "RATED",
      payload: JSON.stringify({ stars: rating.stars }),
    },
  });

  return json({ ok: true, rating: { stars: rating.stars, note: rating.note } });
});
