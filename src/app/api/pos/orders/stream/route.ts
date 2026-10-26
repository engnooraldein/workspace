import { handler } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { channelForBranch, ensureRealtimeBridge, subscribe, type OrderEventPayload } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** SSE stream for the cashier/kitchen screen — receives every order event of a branch. */
export const GET = handler(async (request: Request) => {
  const session = await requireSession();

  const branchId = new URL(request.url).searchParams.get("branchId");
  if (!branchId) return new Response("MISSING_BRANCH", { status: 400 });

  if (session.role !== "SUPER_ADMIN" && session.branchId !== branchId) {
    return new Response("FORBIDDEN", { status: 403 });
  }

  ensureRealtimeBridge();

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

      const unsubscribe = subscribe(channelForBranch(branchId), (event: OrderEventPayload) => {
        write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });

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
});
