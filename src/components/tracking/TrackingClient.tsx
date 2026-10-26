"use client";

import { useEffect, useMemo, useState } from "react";

import MenuModal from "@/components/tracking/MenuModal";
import PromoSlider from "@/components/tracking/PromoSlider";
import RatingCard from "@/components/tracking/RatingCard";
import StatusTimeline from "@/components/tracking/StatusTimeline";
import { useBuzzerAlert, useOrderStream } from "@/components/tracking/useOrderStream";
import { usePushNotifications } from "@/components/tracking/usePushNotifications";
import { dict, localized, type Lang } from "@/lib/i18n";
import { formatElapsed, formatMoney, formatTime } from "@/lib/format";
import { saveActiveOrder } from "@/lib/orderMemory";
import type { PublicMenuCategory, PublicPromo, PublicOrder } from "@/lib/types";

type Props = {
  initial: PublicOrder;
  menu: PublicMenuCategory[];
  promos: PublicPromo[];
  lang: Lang;
};

export default function TrackingClient({ initial, menu, promos, lang }: Props) {
  const t = dict[lang];
  const { order, connected } = useOrderStream(initial.token, initial);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const restaurant = order.restaurant;
  const buzzer = useBuzzerAlert(soundOn && order.status === "READY");
  const push = usePushNotifications(order.token, order.number, restaurant.name);

  // Automatically remember this order in customer's browser memory
  useEffect(() => {
    saveActiveOrder({
      token: order.token,
      number: order.number,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
      status: order.status,
    });
  }, [order.token, order.number, order.status, restaurant.name, restaurant.slug]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // When order becomes ready, alert customer via lock-screen notification & continuous buzzer
  useEffect(() => {
    if (order.status === "READY") {
      void push.notifyReady();
      buzzer.start();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([600, 200, 600, 200, 1000]);
      }
    }
  }, [order.status, push, buzzer]);

  // When cashier clicks "Re-Buzz / رن مجدداً", re-trigger buzzer, phone vibration, and notification
  useEffect(() => {
    const handleRebuzz = () => {
      void push.notifyReady();
      if (soundOn) buzzer.start();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      }
    };
    window.addEventListener("sb:order:rebuzz", handleRebuzz);
    return () => window.removeEventListener("sb:order:rebuzz", handleRebuzz);
  }, [push, soundOn, buzzer]);

  const elapsed = useMemo(() => formatElapsed(order.createdAt, now), [order.createdAt, now]);

  const whatsappLink = restaurant.whatsapp
    ? `https://wa.me/${restaurant.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  async function enableSound() {
    const ok = await buzzer.unlock();
    if (ok) {
      setSoundOn(true);
      if (order.status === "READY") buzzer.start();
    }
  }

  // Auto-unlock audio, vibration, and trigger permission on first customer touch
  useEffect(() => {
    const handleFirstTouch = () => {
      void buzzer.unlock();
      setSoundOn(true);
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          void handleActivateBuzzer();
        }
      }
    };
    window.addEventListener("touchstart", handleFirstTouch, { once: true });
    window.addEventListener("click", handleFirstTouch, { once: true });
    return () => {
      window.removeEventListener("touchstart", handleFirstTouch);
      window.removeEventListener("click", handleFirstTouch);
    };
  }, [buzzer]);

  async function handleActivateBuzzer() {
    await enableSound();
    await push.enableNotifications();

    // Prevent phone screen from sleeping while waiting
    try {
      if ("wakeLock" in navigator) {
        await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request("screen");
      }
    } catch {
      /* ignore */
    }

    // Confirmation vibration
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([150, 70, 150]);
    }
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------- order card */}
      <section className="sb-card sb-fade-up relative overflow-hidden p-5 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-40 blur-3xl"
          style={{ background: `radial-gradient(circle, ${restaurant.primaryColor} 0%, transparent 70%)` }}
          aria-hidden
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          {t["track.orderNumber"]}
        </p>
        <p className="sb-glow-text relative mt-1 text-6xl font-black leading-none">
          {order.number}
        </p>
        {order.tableNumber ? (
          <p className="relative mt-2 text-sm font-semibold text-[var(--muted)]">
            {t["common.branch"]}: {order.tableNumber}
          </p>
        ) : null}
      </section>

      {/* ----------------- Active Buzzer Connection Status (Unmistakable Pager UI) */}
      {(push.subscribed || push.permission === "granted") && order.status !== "COMPLETED" ? (
        <section className="sb-card border-2 border-emerald-400 bg-gradient-to-r from-emerald-950/80 via-[var(--surface)] to-emerald-950/60 p-4 shadow-xl text-start">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-5 w-5 flex-none items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              </span>
              <div>
                <p className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
                  <span>🟢</span>
                  <span>{lang === "ar" ? "جرس الهاتف: مفعّل وجاهز للتنبيه!" : "Phone Buzzer: Active & Ready!"}</span>
                </p>
                <p className="text-xs text-emerald-100/85 mt-0.5">
                  {lang === "ar"
                    ? "هاتفك مربوط بالطلب — سيهتز ويرن فور جهوزية الوجبة حتى لو أغلقت الشاشة."
                    : "Your phone is connected — will ring & vibrate when ready even if locked."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await enableSound();
                void push.notifyReady();
                if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                  navigator.vibrate([350, 150, 350]);
                }
              }}
              className="sb-btn sb-btn-primary flex-none whitespace-nowrap w-full sm:w-auto !py-2 !px-4 text-xs font-black shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              title="تجربة رنين واهتزاز الهاتف"
            >
              <span>📳</span>
              <span>{lang === "ar" ? "اضغط لتجربة الرنين والتأكد" : "Test Ring & Vibrate"}</span>
            </button>
          </div>
        </section>
      ) : order.status !== "COMPLETED" ? (
        <section className="sb-card sb-fade-up border-2 border-amber-500 bg-gradient-to-br from-amber-950/70 via-[var(--surface)] to-amber-950/40 p-5 shadow-2xl text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl animate-bounce">
            🔔
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              {lang === "ar"
                ? "⚠️ جرس الهاتف غير مفعّل بعد"
                : "⚠️ Phone Buzzer Not Active"}
            </h3>
            <p className="mt-1 text-xs text-amber-200/90 leading-relaxed max-w-sm mx-auto">
              {lang === "ar"
                ? "اضغط قبول بالأسفل ليصلك رنين واهتزاز مباشر فور جهوزية طلبك، حتى لو أغلقت الشاشة أو تركت المتصفح."
                : "Tap accept below to receive vibration & ring when ready, even if you lock your phone or leave the browser."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleActivateBuzzer}
            disabled={push.subscribing}
            className="sb-btn sb-btn-primary w-full !py-3.5 text-sm font-black shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            <span className="text-lg">✅</span>
            <span>
              {push.subscribing
                ? t["common.loading"]
                : (lang === "ar" ? "قبول وتفعيل التنبيه الآن" : "Accept & Enable Alert Now")}
            </span>
          </button>
        </section>
      ) : null}

      {/* ---------------------------------------------------- sound fallback toggle */}
      {!soundOn ? (
        <button
          type="button"
          onClick={enableSound}
          className="sb-btn sb-btn-warm w-full sb-fade-up !py-2 text-xs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
          {t["track.soundOn"]}
        </button>
      ) : null}

      {/* ------------------------------------------------------ ready state */}
      {order.status === "READY" ? (
        <section className="sb-ring-ready sb-fade-up rounded-3xl bg-emerald-500/12 p-6 text-center">
          <div className="sb-pulse mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-emerald-300">{t["track.readyTitle"]}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-emerald-100/85">
            {t["track.readyBody"]}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-extrabold text-emerald-200">
            {t["track.readyCta"]}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------- completed state */}
      {order.status === "COMPLETED" ? (
        <section className="sb-card sb-fade-up p-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-black">{t["track.pickupTitle"]}</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--muted)]">{t["track.pickupBody"]}</p>
        </section>
      ) : null}

      {/* ------------------------------------------------- cancelled state */}
      {order.status === "CANCELLED" ? (
        <section className="sb-card sb-fade-up border-rose-500/40 bg-rose-500/10 p-5 text-center">
          <p className="font-extrabold text-rose-300">{t["track.status.cancelled"]}</p>
        </section>
      ) : null}

      {/* -------------------------------------------------- order meta card */}
      <section className="sb-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)]">{t["track.orderTime"]}</p>
            <p className="text-sm font-bold">{formatTime(order.createdAt, lang)}</p>
          </div>
          <div className="text-end">
            <p className="text-xs font-semibold text-[var(--muted)]">{t["track.waiting"]}</p>
            <p className="font-mono text-lg font-black text-[var(--brand-primary)]">{elapsed}</p>
          </div>
        </div>

        {order.itemsNote ? (
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <p className="mb-1.5 text-xs font-semibold text-[var(--muted)]">{t["track.items"]}</p>
            <p className="text-sm leading-relaxed">{order.itemsNote}</p>
          </div>
        ) : null}

        {order.totalAmount > 0 ? (
          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4">
            <span className="text-xs font-semibold text-[var(--muted)]">{t["admin.totalOrders"]}</span>
            <span className="text-lg font-black text-[var(--brand-secondary)]">
              {formatMoney(order.totalAmount, lang, restaurant.currency)}
            </span>
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------ timeline */}
      {order.status !== "COMPLETED" && order.status !== "CANCELLED" ? (
        <section className="sb-card p-5">
          <h2 className="mb-4 text-base font-extrabold">{t["track.title"]}</h2>
          <StatusTimeline status={order.status} lang={lang} />
        </section>
      ) : null}

      {/* --------------------------------------------------------- rating */}
      {order.status === "COMPLETED" ? (
        <RatingCard token={order.token} lang={lang} initialStars={order.rating?.stars ?? null} />
      ) : null}

      {/* ---------------------------------------------------------- promos */}
      <PromoSlider promos={promos} lang={lang} />

      {/* ------------------------------------------------------ menu button */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="sb-btn sb-btn-ghost w-full"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 8h8M8 12h8M8 16h5" />
        </svg>
        {t["track.menu"]}
      </button>

      {/* ------------------------------------------------------- social row */}
      {restaurant.instagram || restaurant.facebook || restaurant.tiktok || whatsappLink ? (
        <section className="sb-card p-4">
          <p className="mb-2.5 text-center text-xs font-bold text-[var(--muted)]">
            {t["track.followSocial"]}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="sb-btn sb-btn-ghost !px-3 !py-2 text-xs">
                WhatsApp
              </a>
            ) : null}
            {restaurant.phone ? (
              <a href={`tel:${restaurant.phone}`} className="sb-btn sb-btn-ghost !px-3 !py-2 text-xs">
                {t["track.callStaff"]}
              </a>
            ) : null}
            {restaurant.instagram ? (
              <a href={restaurant.instagram.startsWith("http") ? restaurant.instagram : `https://instagram.com/${restaurant.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="sb-btn sb-btn-ghost !px-3 !py-2 text-xs">
                Instagram
              </a>
            ) : null}
            {restaurant.facebook ? (
              <a href={restaurant.facebook.startsWith("http") ? restaurant.facebook : `https://facebook.com/${restaurant.facebook}`} target="_blank" rel="noopener noreferrer" className="sb-btn sb-btn-ghost !px-3 !py-2 text-xs">
                Facebook
              </a>
            ) : null}
            {restaurant.tiktok ? (
              <a href={restaurant.tiktok.startsWith("http") ? restaurant.tiktok : `https://tiktok.com/@${restaurant.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="sb-btn sb-btn-ghost !px-3 !py-2 text-xs">
                TikTok
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------- connection state */}
      <p className="flex items-center justify-center gap-2 pb-2 text-center text-[0.68rem] font-semibold text-[var(--muted)]">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            connected ? "bg-emerald-400" : "bg-amber-400"
          }`}
          aria-hidden
        />
        {connected ? localized(restaurant.name, restaurant.nameEn, lang) : t["track.disconnected"]}
      </p>

      <MenuModal
        menu={menu}
        lang={lang}
        currency={restaurant.currency}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  );
}
