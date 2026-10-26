"use client";

import { useEffect, useState } from "react";

import { dict, localized, type Lang } from "@/lib/i18n";
import type { PublicPromo } from "@/lib/types";

type Props = {
  promos: PublicPromo[];
  lang: Lang;
};

export default function PromoSlider({ promos, lang }: Props) {
  const t = dict[lang];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (promos.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

  if (promos.length === 0) return null;

  const promo = promos[index];

  return (
    <section className="sb-card relative overflow-hidden p-4" aria-label={t["track.promos"]}>
      <div className="mb-2 flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-wider text-[var(--brand-secondary)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
        {t["track.promos"]}
      </div>

      <div key={promo.id} className="sb-fade-up">
        {promo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={promo.imageUrl}
            alt=""
            className="mb-3 h-28 w-full rounded-xl object-cover"
            loading="lazy"
          />
        ) : null}
        <p className="font-extrabold leading-snug">{localized(promo.title, promo.titleEn, lang)}</p>
        {localized(promo.body, promo.bodyEn, lang) ? (
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
            {localized(promo.body, promo.bodyEn, lang)}
          </p>
        ) : null}
        {promo.linkUrl ? (
          <a
            href={promo.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-bold text-[var(--brand-primary)] underline underline-offset-4"
          >
            {t["admin.linkUrl"]}
          </a>
        ) : null}
      </div>

      {promos.length > 1 ? (
        <div className="mt-3 flex gap-1.5">
          {promos.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(dotIndex)}
              aria-label={`${t["track.promos"]} ${dotIndex + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                dotIndex === index
                  ? "w-6 bg-[var(--brand-secondary)]"
                  : "w-1.5 bg-[var(--line)] hover:bg-[var(--muted)]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
