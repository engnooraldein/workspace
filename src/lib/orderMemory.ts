"use client";

export type SavedOrder = {
  token: string;
  number: number;
  restaurantName: string;
  slug: string;
  status: string;
  savedAt: number;
};

const STORAGE_KEY = "sb_active_orders";

export function saveActiveOrder(order: {
  token: string;
  number: number;
  restaurantName: string;
  slug: string;
  status?: string;
}): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getActiveOrders();
    // Filter out if same token already exists
    const updated = existing.filter((item) => item.token !== order.token);

    updated.unshift({
      token: order.token,
      number: order.number,
      restaurantName: order.restaurantName,
      slug: order.slug,
      status: order.status || "PREPARING",
      savedAt: Date.now(),
    });

    // Keep up to 5 recent orders
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 5)));
  } catch (err) {
    console.error("Failed to save order to localStorage:", err);
  }
}

export function getActiveOrders(): SavedOrder[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedOrder[];

    // Only keep orders saved within the last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return list.filter((item) => item.savedAt > oneDayAgo);
  } catch {
    return [];
  }
}

export function removeSavedOrder(token: string): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getActiveOrders();
    const updated = existing.filter((item) => item.token !== token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
