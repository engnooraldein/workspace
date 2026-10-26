import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ token: string }>;
};

/**
 * Ultra-fast sub-second status check for mobile customer buzzer.
 * Bypasses all caching layers to guarantee instant status change delivery.
 */
export async function GET(_request: Request, { params }: Props) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    select: {
      status: true,
      readyAt: true,
      completedAt: true,
    },
  });

  if (!order) {
    return new Response(JSON.stringify({ error: "NOT_FOUND" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  }

  return new Response(
    JSON.stringify({
      status: order.status,
      readyAt: order.readyAt?.toISOString() ?? null,
      completedAt: order.completedAt?.toISOString() ?? null,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
