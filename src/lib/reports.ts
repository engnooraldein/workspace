import { prisma } from "./db";
import { averagePrepMinutes } from "./orders";

export type TenantReport = {
  totalOrders: number;
  ordersToday: number;
  avgPrepMinutes: number;
  avgRating: number;
  ratingsCount: number;
  ratingBreakdown: { stars: number; count: number }[];
  daily: { date: string; orders: number }[];
  perBranch: { branchId: string; name: string; orders: number; avgPrepMinutes: number }[];
};

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function lastNDays(count: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 86_400_000);
    keys.push(dayKey(date));
  }
  return keys;
}

/**
 * Aggregated report for one tenant (or the whole platform when tenantId is null).
 * Aggregation happens in JS so the same code works on SQLite and Postgres.
 */
export async function buildReport(tenantId: string | null, days = 14): Promise<TenantReport> {
  const since = new Date(Date.now() - days * 86_400_000);

  const [orders, ratings, branches] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        createdAt: { gte: since },
      },
      select: {
        id: true,
        branchId: true,
        createdAt: true,
        readyAt: true,
        completedAt: true,
        status: true,
        totalAmount: true,
      },
    }),
    prisma.rating.findMany({
      where: {
        ...(tenantId ? { order: { tenantId } } : {}),
        createdAt: { gte: since },
      },
      select: { stars: true },
    }),
    prisma.branch.findMany({
      where: tenantId ? { tenantId } : undefined,
      select: { id: true, name: true },
    }),
  ]);

  const today = dayKey(new Date());
  const ordersToday = orders.filter((order) => dayKey(order.createdAt) === today).length;

  const counts = new Map<string, number>();
  for (const order of orders) {
    const key = dayKey(order.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const daily = lastNDays(days).map((date) => ({ date, orders: counts.get(date) ?? 0 }));

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratings.filter((rating) => rating.stars === stars).length,
  }));

  const avgRating = ratings.length
    ? Math.round((ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length) * 10) / 10
    : 0;

  const perBranch = branches.map((branch) => {
    const branchOrders = orders.filter((order) => order.branchId === branch.id);
    return {
      branchId: branch.id,
      name: branch.name,
      orders: branchOrders.length,
      avgPrepMinutes: averagePrepMinutes(branchOrders),
    };
  });

  return {
    totalOrders: orders.length,
    ordersToday,
    avgPrepMinutes: averagePrepMinutes(orders),
    avgRating,
    ratingsCount: ratings.length,
    ratingBreakdown,
    daily,
    perBranch,
  };
}
