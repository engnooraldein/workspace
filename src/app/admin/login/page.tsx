import { redirect } from "next/navigation";
import Link from "next/link";

import { getSession } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  const lang = await getLang();
  const t = dict[lang];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="Smart Buzzer"
            className="mx-auto h-16 w-16 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          />
          <h1 className="text-2xl font-black">{t["admin.login"]}</h1>
          <p className="text-xs text-[var(--muted)]">
            {lang === "ar"
              ? "لوحة التحكم المركزية لإدارة المطاعم والاشتراكات والمنيو"
              : "Central administration for restaurants, menus, and subscriptions"}
          </p>
        </div>

        <AdminLoginForm lang={lang} />

        <div className="text-center">
          <Link href="/" className="text-xs text-[var(--muted)] hover:text-white transition">
            ← {lang === "ar" ? "العودة للصفحة الرئيسية" : "Back to Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
