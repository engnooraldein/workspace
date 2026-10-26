import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import AdminMenuManager from "./AdminMenuManager";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tenantId?: string }>;
};

export default async function AdminMenuPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = await getLang();

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, currency: true },
  });

  if (tenants.length === 0) {
    return (
      <div className="sb-card p-12 text-center text-[var(--muted)]">
        <p className="font-bold">يرجى إضافة مطعم أولاً في صفحة المطاعم.</p>
      </div>
    );
  }

  const activeTenantId = query.tenantId ?? tenants[0].id;

  const [categories, promos] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            nameEn: true,
            description: true,
            price: true,
            isAvailable: true,
          },
        },
      },
    }),
    prisma.promo.findMany({
      where: { tenantId: activeTenantId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        titleEn: true,
        body: true,
        isActive: true,
      },
    }),
  ]);

  return (
    <AdminMenuManager
      tenants={tenants}
      initialTenantId={activeTenantId}
      categories={categories}
      promos={promos}
      lang={lang}
    />
  );
}
