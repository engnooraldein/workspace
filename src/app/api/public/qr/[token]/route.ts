import { handler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { buildTrackingUrl } from "@/lib/orders";
import { qrPng } from "@/lib/qr";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PNG QR code of the tracking URL for a given order token. */
export const GET = handler(async (request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { tenant: true },
  });
  if (!order) return new Response("NOT_FOUND", { status: 404 });

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : undefined;

  const trackingUrl = buildTrackingUrl(order.tenant.slug, order.publicToken, origin);
  const png = await qrPng(trackingUrl, { width: 640, margin: 1 });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
});
