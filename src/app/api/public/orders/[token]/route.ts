import { handler, json } from "@/lib/api";
import { loadPublicOrder } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export const GET = handler(async (_request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  const order = await loadPublicOrder(token);
  if (!order) return json({ error: "NOT_FOUND" }, 404);
  return json(order);
});
