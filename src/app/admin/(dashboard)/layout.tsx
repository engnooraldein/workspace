import { redirect } from "next/navigation";
import Link from "next/link";

import LanguageToggle from "@/components/LanguageToggle";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/admin/login");
  }

  const lang = await getLang();
  const t = dict[lang];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(6,11,22,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="Admin"
              className="h-9 w-9 rounded-xl object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.3)]"
            />
            <div>
              <Link href="/admin" className="text-base font-black leading-tight hover:text-[var(--brand-primary)] transition">
                {t["admin.title"]}
              </Link>
              <p className="text-[11px] text-[var(--muted)]">
                {session.name} <span className="text-[var(--brand-secondary)] font-bold">({session.role})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="sb-btn sb-btn-ghost !py-1.5 !px-3 text-xs hidden sm:inline-flex"
            >
              🌐 {lang === "ar" ? "الموقع العام" : "Public Site"}
            </Link>
            <LanguageToggle lang={lang} />
            <form action={logoutAction}>
              <button type="submit" className="sb-btn sb-btn-ghost !py-1.5 !px-3 text-xs text-rose-300 hover:text-rose-200">
                {t["pos.signOut"]}
              </button>
            </form>
          </div>
        </div>

        {/* Subnav Navigation Tabs */}
        <nav className="border-t border-[var(--line)] bg-[rgba(13,21,38,0.7)]">
          <div className="mx-auto flex max-w-6xl gap-1 px-4 sb-scroll-x">
            <Link
              href="/admin"
              className="border-b-2 border-transparent px-3 py-2.5 text-xs font-bold text-slate-300 hover:border-[var(--brand-primary)] hover:text-white transition whitespace-nowrap"
            >
              📊 {lang === "ar" ? "لوحة المعلومات" : "Dashboard"}
            </Link>
            <Link
              href="/admin/restaurants"
              className="border-b-2 border-transparent px-3 py-2.5 text-xs font-bold text-slate-300 hover:border-[var(--brand-primary)] hover:text-white transition whitespace-nowrap"
            >
              🏪 {t["admin.restaurants"]} & {t["admin.subscription"]}
            </Link>
            <Link
              href="/admin/menu"
              className="border-b-2 border-transparent px-3 py-2.5 text-xs font-bold text-slate-300 hover:border-[var(--brand-primary)] hover:text-white transition whitespace-nowrap"
            >
              🍔 {t["admin.menuManagement"]} & {t["admin.promos"]}
            </Link>
            <Link
              href="/admin/reports"
              className="border-b-2 border-transparent px-3 py-2.5 text-xs font-bold text-slate-300 hover:border-[var(--brand-primary)] hover:text-white transition whitespace-nowrap"
            >
              📈 {t["admin.reports"]}
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] py-4 text-center text-xs text-[var(--muted)]">
        Smart Buzzer Admin Console · 2026
      </footer>
    </div>
  );
}
