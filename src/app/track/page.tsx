import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ order?: string | string[] }>;
};

/** Universal tracking route: resolves any token and redirects to the tenant's tracking page */
export default async function GlobalTrackPage({ searchParams }: Props) {
  const query = await searchParams;
  const token = Array.isArray(query.order) ? query.order[0] : query.order;

  if (!token) {
    redirect("/");
  }

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { tenant: true },
  });

  if (!order) {
    notFound();
  }

  redirect(`/${order.tenant.slug}/track?order=${token}`);
}
