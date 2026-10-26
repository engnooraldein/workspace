"use client";

import { useEffect } from "react";

import { dict, localized, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import type { PublicMenuCategory } from "@/lib/types";

type Props = {
  menu: PublicMenuCategory[];
  lang: Lang;
  currency: string;
  open: boolean;
  onClose: () => void;
};

export default function MenuModal({ menu, lang, currency, open, onClose }: Props) {
  const t = dict[lang];

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const hasItems = menu.some((category) => category.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t["track.menuTitle"]}
      onClick={onClose}
    >
      <div
        className="sb-card sb-fade-up flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-b-none sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-lg font-extrabold">{t["track.menuTitle"]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="sb-btn sb-btn-ghost !p-2"
            aria-label={t["common.cancel"]}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="sb-scroll-x flex-1 overflow-y-auto px-5 py-4">
          {!hasItems ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">{t["admin.noData"]}</p>
          ) : (
            <div className="space-y-7">
              {menu.map((category) => {
                if (category.items.length === 0) return null;
                return (
                  <section key={category.id}>
                    <h3 className="sb-glow-text mb-3 text-base font-extrabold">
                      {localized(category.name, category.nameEn, lang)}
                    </h3>
                    <ul className="space-y-2.5">
                      {category.items.map((item) => (
                        <li
                          key={item.id}
                          className="sb-card sb-card-hover flex items-start gap-3 !rounded-xl p-3"
                        >
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-14 w-14 flex-none rounded-lg object-cover"
                              loading="lazy"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="font-bold leading-tight">{item.name}</p>
                              <p className="flex-none text-sm font-extrabold text-[var(--brand-secondary)]">
                                {formatMoney(item.price, lang, currency)}
                              </p>
                            </div>
                            {item.nameEn ? (
                              <p className="text-xs text-[var(--muted)]" dir="ltr">
                                {item.nameEn}
                              </p>
                            ) : null}
                            {localized(item.description, item.descriptionEn, lang) ? (
                              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                                {localized(item.description, item.descriptionEn, lang)}
                              </p>
                            ) : null}
                            {!item.isAvailable ? (
                              <span className="mt-1.5 inline-block rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-[0.68rem] font-bold text-rose-300">
                                {t["track.categoryUnavailable"]}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
