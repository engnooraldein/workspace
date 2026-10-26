"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLangAction } from "@/app/actions/auth";
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from "@/lib/i18n";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function applyDirection(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

/** Switches the whole UI between Arabic (RTL) and English (LTR). */
export default function LanguageToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next: Lang = lang === "ar" ? "en" : "ar";

  function switchTo() {
    // Instant visual flip, then persist + refresh so server-rendered text follows.
    applyDirection(next);
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(async () => {
      await setLangAction(next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      className="sb-btn sb-btn-ghost !px-3 !py-1.5 text-sm"
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      title={lang === "ar" ? "English" : "العربية"}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}
