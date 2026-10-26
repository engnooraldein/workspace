import Link from "next/link";

import { prisma } from "@/lib/db";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { buildReport } from "@/lib/reports";
import SubscriptionToggle from "./restaurants/SubscriptionToggle";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const lang = await getLang();
  const t = dict[lang];

  const [tenants, report] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        branches: { select: { id: true, name: true } },
        _count: { select: { orders: true, menuCategories: true } },
      },
    }),
    buildReport(null, 14),
  ]);

  const activeCount = tenants.filter((r) => r.subscriptionStatus === "active").length;
  const frozenCount = tenants.filter((r) => r.subscriptionStatus === "frozen").length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Top Stats Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Restaurants Stat */}
        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.restaurants"]}
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{tenants.length}</span>
            <span className="text-xs font-semibold text-emerald-400">
              {activeCount} {t["common.active"]} / {frozenCount} {t["common.frozen"]}
            </span>
          </div>
          <div className="mt-3 flex gap-1.5 h-1.5 rounded-full overflow-hidden bg-slate-800">
            <div
              className="bg-emerald-400 rounded-full"
              style={{ width: `${tenants.length ? (activeCount / tenants.length) * 100 : 0}%` }}
            />
            <div
              className="bg-amber-400 rounded-full"
              style={{ width: `${tenants.length ? (frozenCount / tenants.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Orders Today */}
        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["pos.ordersToday"]}
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[var(--brand-primary)]">
              {report.ordersToday}
            </span>
            <span className="text-xs text-[var(--muted)] font-mono">
              {report.totalOrders} {lang === "ar" ? "إجمالي" : "all-time"}
            </span>
          </div>
        </div>

        {/* Average Prep Time */}
        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.avgPrepTime"]}
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[var(--brand-secondary)]">
              {report.avgPrepMinutes} <span className="text-base font-bold">{t["pos.minutes"]}</span>
            </span>
            <span className="text-xs text-emerald-400 font-semibold">⚡ لحظي</span>
          </div>
        </div>

        {/* Customer Rating */}
        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.avgRating"]}
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-300">
              {report.avgRating > 0 ? `${report.avgRating} ★` : "—"}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {report.ratingsCount} {lang === "ar" ? "تقييم" : "reviews"}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Quick Action Banner */}
      <div className="sb-card p-5 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-sky-950/40 via-[var(--surface)] to-amber-950/30">
        <div>
          <h2 className="text-base font-black">
            {lang === "ar" ? "إدارة سريعة للمنصة" : "Platform Quick Controls"}
          </h2>
          <p className="text-xs text-[var(--muted)]">
            {lang === "ar"
              ? "يمكنك إضافة مطاعم جديدة، تجميد أو فك تجميد الاشتراكات، وإدارة قوائم الطعام فورياً."
              : "Create new tenants, toggle subscription status, and update menus instantly."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/restaurants" className="sb-btn sb-btn-primary !py-2 text-xs">
            + {t["admin.newRestaurant"]}
          </Link>
          <Link href="/admin/menu" className="sb-btn sb-btn-ghost !py-2 text-xs">
            🍔 {t["admin.menuManagement"]}
          </Link>
          <Link href="/admin/reports" className="sb-btn sb-btn-ghost !py-2 text-xs">
            📈 {t["admin.reports"]}
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------ Restaurants Table */}
      <section className="sb-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{t["admin.restaurants"]}</h2>
          <Link href="/admin/restaurants" className="text-xs font-bold text-[var(--brand-primary)] hover:underline">
            {lang === "ar" ? "عرض كافة المطاعم والتفاصيل ←" : "View all restaurants →"}
          </Link>
        </div>

        {tenants.length === 0 ? (
          <p className="p-8 text-center text-sm text-[var(--muted)]">{t["admin.noData"]}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--muted)] font-semibold">
                  <th className="pb-3 text-start">{t["admin.restaurants"]}</th>
                  <th className="pb-3 text-start">{t["admin.slug"]}</th>
                  <th className="pb-3 text-start">{t["admin.plan"]}</th>
                  <th className="pb-3 text-start">{t["common.branch"]}</th>
                  <th className="pb-3 text-start">{t["pos.activeOrders"]}</th>
                  <th className="pb-3 text-start">{t["admin.subscription"]}</th>
                  <th className="pb-3 text-end">{t["common.actions"]}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        {tenant.logoBytes ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/tenant/${tenant.id}/logo`}
                            alt=""
                            className="h-8 w-8 rounded-lg object-cover ring-1 ring-[var(--line)]"
                          />
                        ) : (
                          <div
                            className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black"
                            style={{
                              background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                              color: "#06121a",
                            }}
                          >
                            {tenant.name.slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-white text-sm">{tenant.name}</p>
                          {tenant.nameEn ? <p className="text-[10px] text-[var(--muted)]">{tenant.nameEn}</p> : null}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 font-mono text-[var(--muted)]">
                      /{tenant.slug}
                    </td>

                    <td className="py-3">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                        {tenant.plan}
                      </span>
                    </td>

                    <td className="py-3 text-[var(--muted)]">
                      {tenant.branches.length} {lang === "ar" ? "فروع" : "branches"}
                    </td>

                    <td className="py-3 font-bold text-[var(--brand-primary)]">
                      {tenant._count.orders}
                    </td>

                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          tenant.subscriptionStatus === "active"
                            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            tenant.subscriptionStatus === "active" ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {tenant.subscriptionStatus === "active" ? t["common.active"] : t["common.frozen"]}
                      </span>
                    </td>

                    <td className="py-3 text-end space-x-2 space-x-reverse">
                      <SubscriptionToggle
                        tenantId={tenant.id}
                        status={tenant.subscriptionStatus as "active" | "frozen"}
                        lang={lang}
                      />

                      <Link
                        href={`/${tenant.slug}/pos`}
                        className="sb-btn sb-btn-ghost !p-1.5 text-[11px]"
                        title={t["pos.title"]}
                      >
                        📟 POS
                      </Link>

                      <Link
                        href={`/${tenant.slug}`}
                        className="sb-btn sb-btn-ghost !p-1.5 text-[11px]"
                        title={t["admin.openStore"]}
                      >
                        🌐
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
