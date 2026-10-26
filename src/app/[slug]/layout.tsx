import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LanguageToggle from "@/components/LanguageToggle";
import { getLang } from "@/lib/lang";
import { getTenantBySlug, isTenantActive } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Smart Buzzer" };

  return {
    title: tenant.name,
    description: tenant.tagline ?? tenant.taglineEn ?? tenant.name,
    openGraph: {
      title: tenant.name,
      description: tenant.tagline ?? tenant.taglineEn ?? undefined,
      images: tenant.logoBytes ? [`/api/tenant/${tenant.id}/logo`] : undefined,
    },
  };
}

/**
 * Tenant shell: per-restaurant branding (logo + colours) and the language
 * switch. Every customer-facing screen of a restaurant lives under here.
 */
export default async function TenantLayout({ children, params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const lang = await getLang();
  const active = isTenantActive(tenant);

  const brandStyle = {
    "--brand-primary": tenant.primaryColor,
    "--brand-secondary": tenant.secondaryColor,
    "--brand-accent": tenant.accentColor,
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="min-h-dvh">
      <header className="sb-no-print sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(6,11,22,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {tenant.logoBytes ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/tenant/${tenant.id}/logo`}
              alt={tenant.name}
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-[var(--line)]"
            />
          ) : (
            <div
              className="grid h-11 w-11 place-items-center rounded-xl text-lg font-black"
              style={{
                background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                color: "#06121a",
              }}
              aria-hidden
            >
              {tenant.name.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold leading-tight">{tenant.name}</p>
            {(lang === "ar" ? tenant.tagline : tenant.taglineEn ?? tenant.tagline) ? (
              <p className="truncate text-xs text-[var(--muted)]">
                {lang === "ar" ? tenant.tagline : tenant.taglineEn ?? tenant.tagline}
              </p>
            ) : null}
          </div>

          <LanguageToggle lang={lang} />
        </div>
      </header>

      {!active ? (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-200">
            {lang === "ar"
              ? "هذا المطعم متوقف مؤقتاً. يرجى المحاولة لاحقاً."
              : "This restaurant is temporarily paused. Please try again later."}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4">{children}</main>
    </div>
  );
}
