"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { dict, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import type { PublicRestaurant } from "@/lib/types";
import QrScannerModal from "@/components/scanner/QrScannerModal";
import SavedOrderBanner from "@/components/tracking/SavedOrderBanner";

type Props = {
  restaurant: PublicRestaurant;
  lang: Lang;
};

export default function RestaurantPublicClient({ restaurant, lang }: Props) {
  const t = dict[lang];
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [trackToken, setTrackToken] = useState("");
  const [trackError, setTrackError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const categories = restaurant.menu;
  const allItems = categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryName: cat.name, categoryNameEn: cat.nameEn }))
  );

  const displayedItems =
    selectedCategory === "all"
      ? allItems
      : categories.find((c) => c.id === selectedCategory)?.items ?? [];

  function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = trackToken.trim();
    if (!token) {
      setTrackError(lang === "ar" ? "يرجى إدخال رمز الطلب أو الرابط" : "Please enter your order code or link");
      return;
    }
    // Support either full token or extracted token from URL
    const cleanToken = token.includes("order=")
      ? new URL(token, "http://dummy.com").searchParams.get("order") ?? token
      : token;

    router.push(`/${restaurant.slug}/track?order=${encodeURIComponent(cleanToken)}`);
  }

  const whatsappUrl = restaurant.whatsapp
    ? `https://wa.me/${restaurant.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* --------------------------- Active Order Banner (saved in browser memory) */}
      <SavedOrderBanner lang={lang} />

      {/* ---------------------------------------------------- Hero Section */}
      <section className="sb-card relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-52 opacity-35 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${restaurant.primaryColor} 0%, ${restaurant.secondaryColor} 100%)`,
          }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-start gap-5">
          {restaurant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoUrl}
              alt={restaurant.name}
              className="h-24 w-24 flex-none rounded-2xl object-cover ring-2 ring-[var(--line)] shadow-xl"
            />
          ) : (
            <div
              className="grid h-24 w-24 flex-none place-items-center rounded-2xl text-4xl font-black shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${restaurant.primaryColor}, ${restaurant.secondaryColor})`,
                color: "#06121a",
              }}
            >
              {restaurant.name.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black sm:text-3xl">{restaurant.name}</h1>
              {restaurant.nameEn ? (
                <span className="text-sm font-semibold text-[var(--muted)]">({restaurant.nameEn})</span>
              ) : null}
            </div>

            {(lang === "ar" ? restaurant.tagline : restaurant.taglineEn ?? restaurant.tagline) ? (
              <p className="mt-1 text-sm font-medium text-[var(--muted)]">
                {lang === "ar" ? restaurant.tagline : restaurant.taglineEn ?? restaurant.tagline}
              </p>
            ) : null}

            {restaurant.address ? (
              <p className="mt-2 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[var(--muted)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {restaurant.address}
              </p>
            ) : null}

            {/* Social & Contact Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  واتساب
                </a>
              ) : null}

              {restaurant.phone ? (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1 font-bold text-slate-200 ring-1 ring-[var(--line)] hover:bg-[var(--line)] transition"
                >
                  📞 {restaurant.phone}
                </a>
              ) : null}

              {restaurant.instagram ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1 font-bold text-pink-300 ring-1 ring-pink-500/30">
                  📸 {restaurant.instagram}
                </span>
              ) : null}

              <Link
                href={`/${restaurant.slug}/pos`}
                className="sb-btn sb-btn-ghost !px-3 !py-1 text-xs"
              >
                🔐 {t["pos.title"]}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------- Order Tracking Quick Box */}
      <section className="sb-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-[var(--brand-primary)] flex items-center gap-1.5">
            <span>🔍</span>
            <span>{t["track.title"]}</span>
          </h2>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="sb-btn sb-btn-warm !py-1.5 !px-3 text-xs font-black shadow-lg shadow-amber-500/20"
          >
            📷 {lang === "ar" ? "مسح باركود الإيصال بالكاميرا" : "Scan Barcode with Camera"}
          </button>
        </div>

        <p className="text-xs text-[var(--muted)]">
          {lang === "ar"
            ? "هل لديك إيصال طلب؟ صوّر الباركود مباشرة بالكاميرا أو أدخل رمز التتبع لمتابعة حالته لحظياً:"
            : "Have a receipt? Scan the QR code or enter your tracking token to follow live:"}
        </p>

        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={trackToken}
            onChange={(e) => {
              setTrackToken(e.target.value);
              setTrackError("");
            }}
            placeholder={lang === "ar" ? "أدخل رمز التتبع (مثال: a1b2c3d4...)" : "Enter tracking token..."}
            className="sb-input flex-1 font-mono text-sm"
          />
          <button type="submit" className="sb-btn sb-btn-primary whitespace-nowrap">
            {lang === "ar" ? "تتبع الطلب الآن" : "Track Order"}
          </button>
        </form>
        {trackError ? <p className="text-xs font-bold text-rose-400">{trackError}</p> : null}
      </section>

      {/* ---------------------------------------------------- Promo Highlights */}
      {restaurant.promos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-black flex items-center gap-2">
            <span>🔥</span>
            <span>{t["track.promos"]}</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {restaurant.promos.map((promo) => (
              <div
                key={promo.id}
                className="sb-card relative overflow-hidden p-4 border-[var(--brand-secondary)]/40 bg-gradient-to-r from-[var(--surface-2)] to-amber-500/10"
              >
                <p className="font-extrabold text-[var(--brand-secondary)] text-sm">
                  {lang === "ar" ? promo.title : promo.titleEn ?? promo.title}
                </p>
                {(lang === "ar" ? promo.body : promo.bodyEn ?? promo.body) ? (
                  <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                    {lang === "ar" ? promo.body : promo.bodyEn ?? promo.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------- Digital Menu */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black flex items-center gap-2">
            <span>🍽️</span>
            <span>{t["track.menuTitle"]}</span>
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {displayedItems.length} {lang === "ar" ? "صنف" : "items"}
          </span>
        </div>

        {/* Categories Bar */}
        {categories.length > 0 ? (
          <div className="sb-scroll-x flex gap-2 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`sb-btn !py-1.5 !px-3 text-xs whitespace-nowrap ${
                selectedCategory === "all" ? "sb-btn-primary" : "sb-btn-ghost"
              }`}
            >
              {lang === "ar" ? "الكل" : "All"} ({allItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`sb-btn !py-1.5 !px-3 text-xs whitespace-nowrap ${
                  selectedCategory === cat.id ? "sb-btn-primary" : "sb-btn-ghost"
                }`}
              >
                {lang === "ar" ? cat.name : cat.nameEn ?? cat.name} ({cat.items.length})
              </button>
            ))}
          </div>
        ) : null}

        {/* Menu Items Grid */}
        {displayedItems.length === 0 ? (
          <div className="sb-card p-8 text-center text-sm text-[var(--muted)]">
            {lang === "ar" ? "لا توجد أصناف في هذا القسم حالياً." : "No items in this category yet."}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className={`sb-card sb-card-hover p-4 flex flex-col justify-between ${
                  !item.isAvailable ? "opacity-60" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                        {lang === "ar" ? item.name : item.nameEn ?? item.name}
                      </h3>
                      {item.nameEn && lang === "ar" ? (
                        <p className="text-[11px] text-[var(--muted)]">{item.nameEn}</p>
                      ) : null}
                    </div>

                    <span className="font-black text-sm text-[var(--brand-secondary)] whitespace-nowrap">
                      {formatMoney(item.price, lang, restaurant.currency)}
                    </span>
                  </div>

                  {(lang === "ar" ? item.description : item.descriptionEn ?? item.description) ? (
                    <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                      {lang === "ar" ? item.description : item.descriptionEn ?? item.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2 text-[11px]">
                  {item.isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {t["admin.available"]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      {t["admin.unavailable"]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        lang={lang}
      />
    </div>
  );
}
