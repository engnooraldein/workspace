import { handler, json } from "@/lib/api";
import { loadPublicOrder } from "@/lib/serialize";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = handler(async (_request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  const order = await loadPublicOrder(token);
  if (!order) return json({ error: "NOT_FOUND" }, 404);

  return new Response(JSON.stringify(order), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
});
