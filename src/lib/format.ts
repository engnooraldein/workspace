import type { Lang } from "./i18n";

/** Money is stored as whole Iraqi Dinar (no fils in circulation). */
export function formatMoney(amount: number, lang: Lang, currency = "IQD"): string {
  const locale = lang === "ar" ? "ar-IQ" : "en-US";
  const value = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  return lang === "ar" ? `${value} د.ع` : `${value} ${currency}`;
}

export function formatTime(date: Date | string, lang: Lang): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-IQ" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Baghdad",
  }).format(value);
}

export function formatDate(date: Date | string, lang: Lang): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-IQ" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Baghdad",
  }).format(value);
}

/** "mm:ss" elapsed timer for the waiting screen. */
export function formatElapsed(from: Date | string, now: Date = new Date()): string {
  const start = typeof from === "string" ? new Date(from) : from;
  const seconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
