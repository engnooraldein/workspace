"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction, type LoginState } from "@/app/actions/auth";
import { dict, type Lang } from "@/lib/i18n";

export default function AdminLoginForm({ lang }: { lang: Lang }) {
  const t = dict[lang];
  const router = useRouter();
  const [state, setState] = useState<LoginState>({});
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await loginAction(state, formData);
      setState(result);
      if (!result.error) router.refresh();
    });
  }

  function fillDemo() {
    setEmail("NOORALDEINSBAH@gmail.com");
    setPassword("SmartBuzzer2026!");
  }

  return (
    <form onSubmit={onSubmit} className="sb-card space-y-4 p-6">
      <div>
        <label className="sb-label" htmlFor="admin-email">
          {t["pos.email"]}
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          dir="ltr"
          className="sb-input"
          placeholder="admin@platform.com"
        />
      </div>

      <div>
        <label className="sb-label" htmlFor="admin-password">
          {t["pos.password"]}
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          dir="ltr"
          className="sb-input"
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-300">
          {state.error === "INVALID_CREDENTIALS"
            ? lang === "ar"
              ? "بيانات الدخول غير صحيحة"
              : "Invalid email or password"
            : state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="sb-btn sb-btn-primary w-full">
        {pending ? t["common.loading"] : t["pos.signIn"]}
      </button>

      {/* Demo Credentials Quick Fill */}
      <div className="pt-2 border-t border-[var(--line)] text-center">
        <button
          type="button"
          onClick={fillDemo}
          className="text-[11px] font-medium text-[var(--brand-primary)] hover:underline"
        >
          {lang === "ar"
            ? "🔑 استخدام بيانات المشرف التجريبي (NOORALDEINSBAH@gmail.com)"
            : "🔑 Autofill demo super admin"}
        </button>
      </div>
    </form>
  );
}
