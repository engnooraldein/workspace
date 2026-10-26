import { notFound, redirect } from "next/navigation";

import PosDashboard from "@/components/pos/PosDashboard";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { getTenantBySlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PosPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await getSession();
  const allowed = session && (session.role === "SUPER_ADMIN" || session.tenantId === tenant.id);
  if (!allowed) redirect(`/${slug}/pos/login`);

  const lang = await getLang();
  const t = dict[lang];

  const branches = tenant.branches.map((branch) => ({ id: branch.id, name: branch.name }));
  const branchId = session.branchId ?? branches[0]?.id ?? "";

  return (
    <div className="space-y-4">
      <section className="sb-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h1 className="text-lg font-black">{t["pos.title"]}</h1>
          <p className="text-xs text-[var(--muted)]">
            {tenant.name} · {session.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/${slug}`} className="sb-btn sb-btn-ghost !py-2 text-xs">
            {t["admin.openStore"]}
          </a>
          <form action={logoutAction}>
            <button type="submit" className="sb-btn sb-btn-ghost !py-2 text-xs">
              {t["pos.signOut"]}
            </button>
          </form>
        </div>
      </section>

      {tenant.subscriptionStatus !== "active" ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-200">
          {t["pos.frozenTenant"]}
        </div>
      ) : null}

      {branches.length === 0 ? (
        <p className="sb-card p-8 text-center text-sm text-[var(--muted)]">{t["common.none"]}</p>
      ) : (
        <PosDashboard
          slug={tenant.slug}
          currency={tenant.currency}
          lang={lang}
          branches={branches}
          initialBranchId={branchId}
        />
      )}
    </div>
  );
}
