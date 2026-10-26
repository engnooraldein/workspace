"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction, type LoginState } from "@/app/actions/auth";
import { dict, type Lang } from "@/lib/i18n";

const ERROR_MESSAGES: Record<string, { ar: string; en: string }> = {
  INVALID_CREDENTIALS: {
    ar: "بيانات الدخول غير صحيحة. حاول مرة أخرى.",
    en: "Invalid email or password. Please try again.",
  },
  TENANT_FROZEN: {
    ar: "اشتراك هذا المطعم مجمّد — تم إيقاف الوصول مؤقتاً.",
    en: "This restaurant's subscription is frozen — access is temporarily disabled.",
  },
  MISSING_CREDENTIALS: {
    ar: "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
    en: "Please enter your email and password.",
  },
  NO_TENANT: {
    ar: "هذا الحساب غير مرتبط بأي مطعم.",
    en: "This account is not linked to a restaurant.",
  },
};

export default function PosLoginForm({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const router = useRouter();
  const [state, setState] = useState<LoginState>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(state, formData);
      setState(result);
      if (!result.error) router.refresh();
    });
  }

  const error = state.error ? ERROR_MESSAGES[state.error] : null;

  return (
    <form onSubmit={onSubmit} className="sb-card space-y-4 p-6">
      <div>
        <label className="sb-label" htmlFor="email">
          {t["pos.email"]}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          dir="ltr"
          className="sb-input"
          placeholder="cashier@restaurant.com"
        />
      </div>

      <div>
        <label className="sb-label" htmlFor="password">
          {t["pos.password"]}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className="sb-input"
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-300">
          {lang === "ar" ? error.ar : error.en}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="sb-btn sb-btn-primary w-full">
        {pending ? t["common.loading"] : t["pos.signIn"]}
      </button>
    </form>
  );
}
