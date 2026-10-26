import { handler } from "@/lib/api";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Serves the restaurant logo stored inside the database. */
export const GET = handler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { logoBytes: true, logoMime: true },
  });

  if (!tenant?.logoBytes) return new Response("NOT_FOUND", { status: 404 });

  const bytes = Buffer.from(tenant.logoBytes);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": tenant.logoMime || "image/png",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=604800",
    },
  });
});
