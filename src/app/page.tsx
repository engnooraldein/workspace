import Link from "next/link";

import LanguageToggle from "@/components/LanguageToggle";
import LandingScannerButton from "@/components/scanner/LandingScannerButton";
import SavedOrderBanner from "@/components/tracking/SavedOrderBanner";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const lang = await getLang();
  const t = dict[lang];
  const session = await getSession();

  const restaurants = await prisma.tenant.findMany({
    where: { subscriptionStatus: "active" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      tagline: true,
      taglineEn: true,
      primaryColor: true,
      secondaryColor: true,
      logoBytes: true,
    },
  });

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.jpeg"
            alt=""
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-[var(--line)]"
          />
          <div>
            <p className="text-base font-black leading-tight">{t["app.name"]}</p>
            <p className="text-xs text-[var(--muted)]">{t["app.tagline"]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          {session ? (
            <form action={logoutAction}>
              <button type="submit" className="sb-btn sb-btn-ghost !py-2 text-xs">
                {t["pos.signOut"]}
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 space-y-4">
        {/* Saved active order banner */}
        <SavedOrderBanner lang={lang} />

        {/* ------------------------------------------------------- hero */}
        <section className="sb-card sb-fade-up relative overflow-hidden p-8 text-center">
          <div
            className="pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-45 blur-3xl"
            style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <h1 className="sb-glow-text text-3xl font-black leading-tight sm:text-4xl">
              {t["landing.title"]}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              {t["landing.subtitle"]}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <LandingScannerButton lang={lang} />
              {session?.role === "SUPER_ADMIN" ? (
                <Link href="/admin" className="sb-btn sb-btn-primary">
                  {t["landing.platformAdmin"]}
                </Link>
              ) : null}
              {session?.tenantId ? null : (
                <Link href="/admin/login" className="sb-btn sb-btn-ghost">
                  {t["landing.platformAdmin"]}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- how it works */}
        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[t["landing.step1"], t["landing.step2"], t["landing.step3"]].map((step, index) => (
            <div key={index} className="sb-card sb-card-hover p-4">
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-[var(--brand-primary)]/15 text-sm font-black text-[var(--brand-primary)]">
                {index + 1}
              </span>
              <p className="text-sm font-semibold leading-relaxed">{step}</p>
            </div>
          ))}
        </section>

        {/* --------------------------------------------------- restaurants */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-black">{t["landing.restaurants"]}</h2>

          {restaurants.length === 0 ? (
            <p className="sb-card p-8 text-center text-sm text-[var(--muted)]">
              {t["admin.noData"]}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {restaurants.map((restaurant) => (
                <li key={restaurant.id}>
                  <Link
                    href={`/${restaurant.slug}`}
                    className="sb-card sb-card-hover flex items-center gap-3 p-4"
                    style={{
                      borderColor: `${restaurant.primaryColor}44`,
                    }}
                  >
                    {restaurant.logoBytes ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/tenant/${restaurant.id}/logo`}
                        alt=""
                        className="h-12 w-12 flex-none rounded-xl object-cover"
                      />
                    ) : (
                      <span
                        className="grid h-12 w-12 flex-none place-items-center rounded-xl text-lg font-black"
                        style={{
                          background: `linear-gradient(135deg, ${restaurant.primaryColor}, ${restaurant.secondaryColor})`,
                          color: "#06121a",
                        }}
                        aria-hidden
                      >
                        {restaurant.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{restaurant.name}</span>
                      <span className="block truncate text-xs text-[var(--muted)]">
                        {lang === "ar"
                          ? restaurant.tagline
                          : restaurant.taglineEn ?? restaurant.tagline}
                      </span>
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-none text-[var(--muted)]"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 text-center text-xs text-[var(--muted)]">
        {t["app.name"]} — {t["app.tagline"]}
      </footer>
    </div>
  );
}
