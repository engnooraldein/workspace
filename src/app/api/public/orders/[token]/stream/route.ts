import { handler } from "@/lib/api";
import { prisma } from "@/lib/db";
import { loadPublicOrder } from "@/lib/serialize";
import { channelForOrder, ensureRealtimeBridge, subscribe, type OrderEventPayload } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-Sent Events stream for the customer tracking screen.
 * Emits a `snapshot` event first, then `order.status` / `order.created` events.
 */
export const GET = handler(
  async (request: Request, { params }: { params: Promise<{ token: string }> }) => {
    const { token } = await params;
    ensureRealtimeBridge();

    const order = await loadPublicOrder(token);
    if (!order) return new Response("NOT_FOUND", { status: 404 });

    const encoder = new TextEncoder();
    let teardown: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const write = (chunk: string) => {
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            /* controller already closed */
          }
        };

        write(`event: snapshot\ndata: ${JSON.stringify(order)}\n\n`);

        const unsubscribe = subscribe(channelForOrder(token), (event: OrderEventPayload) => {
          write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        });

        // Keeps proxies (nginx, Cloudflare) from closing an idle connection.
        const heartbeat = setInterval(() => write(`: ping ${Date.now()}\n\n`), 20000);

        teardown = () => {
          unsubscribe();
          clearInterval(heartbeat);
        };

        request.signal.addEventListener("abort", () => {
          teardown?.();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        });
      },
      cancel() {
        teardown?.();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
);
