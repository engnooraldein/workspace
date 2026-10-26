import { handler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { buildEscPos, receiptLines } from "@/lib/escpos";
import { buildTrackingUrl } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Raw ESC/POS byte stream for a thermal receipt.
 * Pipe it into a print bridge (qz-print / printNode / socket agent).
 */
export const GET = handler(async (request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { tenant: true, branch: true },
  });
  if (!order) return new Response("NOT_FOUND", { status: 404 });

  const url = new URL(request.url);
  const width = url.searchParams.get("width") === "80" ? 80 : 58;
  const includeArabic = url.searchParams.get("arabic") === "1";

  const bytes = buildEscPos(
    receiptLines({
      restaurantName: order.tenant.name,
      restaurantNameEn: order.tenant.nameEn,
      orderNumber: order.number,
      tableNumber: order.tableNumber,
      itemsNote: order.itemsNote,
      totalAmount: order.totalAmount,
      trackingUrl: buildTrackingUrl(order.tenant.slug, order.publicToken),
      createdAt: order.createdAt,
      includeArabic,
    }),
    { width, includeArabic },
  );

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store",
      "X-Printer-Width": `${width}mm`,
    },
  });
});
