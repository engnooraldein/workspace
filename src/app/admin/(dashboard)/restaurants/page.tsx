import Link from "next/link";

import { prisma } from "@/lib/db";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import SubscriptionToggle from "./SubscriptionToggle";
import CreateRestaurantModal from "./CreateRestaurantModal";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantsPage() {
  const lang = await getLang();
  const t = dict[lang];

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      branches: true,
      users: { select: { id: true, name: true, role: true, email: true } },
      _count: { select: { orders: true, menuCategories: true, promos: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black">{t["admin.restaurants"]} & {t["admin.subscription"]}</h1>
          <p className="text-xs text-[var(--muted)]">
            {lang === "ar"
              ? "إدارة المطاعم والاشتراكات، تجميد أو تنشيط الحسابات، والوصول الفوري للـ POS"
              : "Manage restaurants, freeze or unfreeze accounts, and access cashier screens"}
          </p>
        </div>

        <CreateRestaurantModal lang={lang} />
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className={`sb-card p-5 transition ${
              tenant.subscriptionStatus === "frozen" ? "border-amber-500/40 bg-amber-500/5" : ""
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left Brand Details */}
              <div className="flex items-start gap-3.5">
                {tenant.logoBytes ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/tenant/${tenant.id}/logo`}
                    alt={tenant.name}
                    className="h-14 w-14 flex-none rounded-2xl object-cover ring-2 ring-[var(--line)]"
                  />
                ) : (
                  <div
                    className="grid h-14 w-14 flex-none place-items-center rounded-2xl text-2xl font-black shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                      color: "#06121a",
                    }}
                  >
                    {tenant.name.slice(0, 1)}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-white">{tenant.name}</h2>
                    {tenant.nameEn ? (
                      <span className="text-xs text-[var(--muted)] font-semibold">({tenant.nameEn})</span>
                    ) : null}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        tenant.subscriptionStatus === "active"
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          tenant.subscriptionStatus === "active" ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      {tenant.subscriptionStatus === "active" ? t["common.active"] : t["common.frozen"]}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                      {tenant.plan}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {tenant.tagline ?? tenant.taglineEn ?? "لا يوجد وصف"} ·{" "}
                    <span className="font-mono text-[var(--brand-primary)]">/{tenant.slug}</span>
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                    <span>🏢 {tenant.branches.length} {lang === "ar" ? "فروع" : "branches"}</span>
                    <span>🍔 {tenant._count.menuCategories} {t["admin.categories"]}</span>
                    <span>📦 {tenant._count.orders} {t["pos.ordersToday"]}</span>
                    {tenant.phone ? <span>📞 {tenant.phone}</span> : null}
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:self-center">
                <SubscriptionToggle
                  tenantId={tenant.id}
                  status={tenant.subscriptionStatus as "active" | "frozen"}
                  lang={lang}
                />

                <Link
                  href={`/${tenant.slug}/pos`}
                  className="sb-btn sb-btn-primary !py-1.5 !px-3 text-xs"
                >
                  📟 {t["pos.title"]}
                </Link>

                <Link
                  href={`/${tenant.slug}`}
                  target="_blank"
                  className="sb-btn sb-btn-ghost !py-1.5 !px-3 text-xs"
                >
                  🌐 {t["admin.openStore"]}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
