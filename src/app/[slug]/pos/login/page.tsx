import { redirect } from "next/navigation";

import PosLoginForm from "@/components/pos/PosLoginForm";
import { getSession } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { getTenantBySlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PosLoginPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) redirect("/");

  const session = await getSession();
  if (session && (session.role === "SUPER_ADMIN" || session.tenantId === tenant.id)) {
    redirect(`/${slug}/pos`);
  }

  const lang = await getLang();
  const t = dict[lang];

  return (
    <div className="mx-auto max-w-sm py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black">{t["pos.login"]}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{tenant.name}</p>
      </div>
      <PosLoginForm lang={lang} />
    </div>
  );
}
