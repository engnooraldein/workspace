"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveOrders, removeSavedOrder, type SavedOrder } from "@/lib/orderMemory";

export default function SavedOrderBanner({ lang = "ar" }: { lang?: "ar" | "en" }) {
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    setOrders(getActiveOrders());
  }, []);

  if (orders.length === 0) return null;

  const latest = orders[0];

  return (
    <div className="sb-card sb-fade-up relative overflow-hidden p-4 border-[var(--brand-primary)]/40 bg-gradient-to-r from-sky-950/50 via-[var(--surface-2)] to-[var(--surface)] shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
          </span>

          <div>
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{lang === "ar" ? "لديك طلب محفوظ في المتصفح:" : "Active order saved in browser:"}</span>
              <span className="text-[var(--brand-primary)] font-black text-sm">#{latest.number}</span>
              <span className="text-[var(--muted)] text-[11px]">({latest.restaurantName})</span>
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              {lang === "ar"
                ? "يمكنك العودة لمتابعة حالة الطلب أو تعديل الإشعارات بضغطة واحدة"
                : "Return to live order tracking or notification settings with one tap"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link
            href={`/${latest.slug}/track?order=${latest.token}`}
            className="sb-btn sb-btn-primary !py-1.5 !px-3 text-xs font-black flex-1 sm:flex-none text-center"
          >
            {lang === "ar" ? "متابعة الطلب الآن 📲" : "View Order Live 📲"}
          </Link>
          <button
            type="button"
            onClick={() => {
              removeSavedOrder(latest.token);
              setOrders(getActiveOrders());
            }}
            className="text-[var(--muted)] hover:text-rose-400 p-1.5 text-xs transition"
            title={lang === "ar" ? "إخفاء" : "Dismiss"}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
