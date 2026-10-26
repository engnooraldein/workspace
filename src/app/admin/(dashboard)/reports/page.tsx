import Link from "next/link";

import { prisma } from "@/lib/db";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { buildReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tenantId?: string; days?: string }>;
};

export default async function AdminReportsPage({ searchParams }: Props) {
  const query = await searchParams;
  const lang = await getLang();
  const t = dict[lang];

  const days = Number(query.days) || 14;
  const tenantId = query.tenantId || null;

  const [tenants, report] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    buildReport(tenantId, days),
  ]);

  const maxDaily = Math.max(...report.daily.map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ Header & Filters */}
      <div className="sb-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black">{t["admin.reports"]}</h1>
          <p className="text-xs text-[var(--muted)]">
            {lang === "ar"
              ? "تحليلات الأداء، سرعة التجهيز، ورضا الزبائن عبر الفروع والمطاعم"
              : "Performance analytics, prep times, and customer satisfaction across restaurants"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tenant Selector */}
          <form className="flex items-center gap-2">
            <select
              name="tenantId"
              defaultValue={tenantId ?? ""}
              className="sb-input !w-auto !py-1.5 text-xs font-bold"
            >
              <option value="">{lang === "ar" ? "كافة المطاعم (المنصة)" : "All Restaurants"}</option>
              {tenants.map((tn) => (
                <option key={tn.id} value={tn.id}>
                  {tn.name}
                </option>
              ))}
            </select>

            <select
              name="days"
              defaultValue={String(days)}
              className="sb-input !w-auto !py-1.5 text-xs font-bold"
            >
              <option value="7">7 {lang === "ar" ? "أيام" : "days"}</option>
              <option value="14">14 {lang === "ar" ? "يوماً" : "days"}</option>
              <option value="30">30 {lang === "ar" ? "يوماً" : "days"}</option>
            </select>

            <button type="submit" className="sb-btn sb-btn-primary !py-1.5 !px-3 text-xs">
              {t["common.search"]}
            </button>
          </form>
        </div>
      </div>

      {/* ------------------------------------------------ Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.totalOrders"]} ({days} {lang === "ar" ? "يوم" : "days"})
          </p>
          <p className="mt-2 text-3xl font-black text-white">{report.totalOrders}</p>
          <p className="mt-1 text-xs text-[var(--brand-primary)]">
            {report.ordersToday} {t["pos.ordersToday"]}
          </p>
        </div>

        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.avgPrepTime"]}
          </p>
          <p className="mt-2 text-3xl font-black text-[var(--brand-secondary)]">
            {report.avgPrepMinutes} <span className="text-sm font-semibold">{t["pos.minutes"]}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {lang === "ar" ? "من الاستلام إلى الجاهزية" : "From order to ready"}
          </p>
        </div>

        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.avgRating"]}
          </p>
          <p className="mt-2 text-3xl font-black text-amber-300">
            {report.avgRating > 0 ? `${report.avgRating} ★` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {report.ratingsCount} {lang === "ar" ? "تقييمات الزبائن" : "customer reviews"}
          </p>
        </div>

        <div className="sb-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {t["admin.perBranch"]}
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-400">
            {report.perBranch.length}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {lang === "ar" ? "فروع مشمولة في التقرير" : "branches active"}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ Daily Trend Chart */}
      <section className="sb-card p-5 space-y-4">
        <h2 className="text-base font-black flex items-center justify-between">
          <span>📊 {t["admin.ordersPerDay"]}</span>
          <span className="text-xs text-[var(--muted)] font-normal">
            {lang === "ar" ? `آخر ${days} يوماً` : `Last ${days} days`}
          </span>
        </h2>

        <div className="pt-6">
          <div className="flex items-end gap-1.5 sm:gap-2 h-44 border-b border-[var(--line)] pb-2 px-1">
            {report.daily.map((item, index) => {
              const heightPct = Math.max((item.orders / maxDaily) * 100, item.orders > 0 ? 8 : 2);
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1.5 group relative"
                >
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-900 border border-[var(--line)] text-white text-[10px] py-0.5 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                    {item.date}: {item.orders} {lang === "ar" ? "طلب" : "orders"}
                  </div>

                  <div className="w-full flex justify-center">
                    <span className="text-[10px] font-bold text-slate-400 opacity-80 group-hover:text-white">
                      {item.orders > 0 ? item.orders : ""}
                    </span>
                  </div>

                  <div
                    className="w-full max-w-[28px] rounded-t-md transition-all duration-300 group-hover:brightness-125"
                    style={{
                      height: `${heightPct}%`,
                      background:
                        item.orders > 0
                          ? "linear-gradient(180deg, #22d3ee 0%, #0284c7 100%)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  />

                  <span className="text-[9px] text-[var(--muted)] truncate max-w-full font-mono mt-1">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Ratings Breakdown & Branch Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ratings Breakdown */}
        <section className="sb-card p-5 space-y-4">
          <h2 className="text-base font-black">⭐ {t["admin.ratingsBreakdown"]}</h2>
          <div className="space-y-2.5">
            {report.ratingBreakdown.map((row) => {
              const pct = report.ratingsCount ? Math.round((row.count / report.ratingsCount) * 100) : 0;
              return (
                <div key={row.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-bold flex items-center gap-1 text-amber-300">
                    {row.stars} ★
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-end text-[var(--muted)] font-mono">
                    {row.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Per Branch Breakdown */}
        <section className="sb-card p-5 space-y-4">
          <h2 className="text-base font-black">🏢 {t["admin.perBranch"]}</h2>
          {report.perBranch.length === 0 ? (
            <p className="text-xs text-[var(--muted)] py-6 text-center">{t["admin.noData"]}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)]">
                    <th className="pb-2 text-start">{t["common.branch"]}</th>
                    <th className="pb-2 text-start">{t["admin.totalOrders"]}</th>
                    <th className="pb-2 text-end">{t["admin.avgPrepTime"]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {report.perBranch.map((branch) => (
                    <tr key={branch.branchId} className="hover:bg-slate-800/20">
                      <td className="py-2.5 font-bold text-white">{branch.name}</td>
                      <td className="py-2.5 text-[var(--brand-primary)] font-bold">{branch.orders}</td>
                      <td className="py-2.5 text-end font-mono text-[var(--brand-secondary)]">
                        {branch.avgPrepMinutes} {t["pos.minutes"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
