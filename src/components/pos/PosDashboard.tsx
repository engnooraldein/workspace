"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dict, type Lang } from "@/lib/i18n";
import { formatElapsed, formatMoney } from "@/lib/format";
import type { PosOrder } from "@/lib/types";

type Props = {
  slug: string;
  currency: string;
  lang: Lang;
  branches: { id: string; name: string }[];
  initialBranchId: string;
};

type Queue = {
  active: PosOrder[];
  today: PosOrder[];
};

export default function PosDashboard({ slug, currency, lang, branches, initialBranchId }: Props) {
  const t = dict[lang];

  const [branchId, setBranchId] = useState(initialBranchId);
  const [queue, setQueue] = useState<Queue>({ active: [], today: [] });
  const [view, setView] = useState<"active" | "archive">("active");
  const [connected, setConnected] = useState(false);

  const [suggested, setSuggested] = useState(1);
  const [number, setNumber] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [itemsNote, setItemsNote] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ token: string; number: number } | null>(null);
  const [rebuzzingId, setRebuzzingId] = useState<string | null>(null);
  const [rebuzzSuccessId, setRebuzzSuccessId] = useState<string | null>(null);

  const [now, setNow] = useState(() => new Date());
  const numberRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------ data load
  const load = useCallback(async () => {
    if (!branchId) return;
    try {
      const [activeRes, todayRes] = await Promise.all([
        fetch(`/api/pos/orders?branchId=${encodeURIComponent(branchId)}&scope=active`, {
          cache: "no-store",
        }),
        fetch(`/api/pos/orders?branchId=${encodeURIComponent(branchId)}&scope=today`, {
          cache: "no-store",
        }),
      ]);

      if (!activeRes.ok || !todayRes.ok) return;

      const active = (await activeRes.json()) as { orders: PosOrder[]; suggestedNumber: number };
      const today = (await todayRes.json()) as { orders: PosOrder[] };

      setQueue({ active: active.orders, today: today.orders });
      setSuggested(active.suggestedNumber);
    } catch {
      /* offline — the next tick will retry */
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live updates over SSE, with a polling fallback.
  useEffect(() => {
    if (!branchId) return;

    const source = new EventSource(`/api/pos/orders/stream?branchId=${encodeURIComponent(branchId)}`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.addEventListener("order.created", () => void load());
    source.addEventListener("order.status", () => void load());
    source.addEventListener("order.rebuzz", () => void load());

    const poll = setInterval(() => {
      if (!connected) void load();
    }, 10000);

    return () => {
      source.close();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, load]);

  // ------------------------------------------------------------- actions
  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);

    const orderNumber = Number(number);
    if (!orderNumber || orderNumber < 1) {
      setCreateError(t["pos.needNumber"]);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          number: orderNumber,
          tableNumber: tableNumber.trim() || null,
          itemsNote: itemsNote.trim() || null,
          totalAmount: totalAmount ? Number(totalAmount) : 0,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        order?: { token: string; number: number };
      };

      if (!response.ok || !payload.order) {
        setCreateError(
          payload.error === "DUPLICATE_NUMBER"
            ? t["pos.duplicateNumber"]
            : payload.error ?? "ERROR",
        );
        return;
      }

      setIssued(payload.order);
      setNumber("");
      setTableNumber("");
      setItemsNote("");
      setTotalAmount("");
      void load();
      numberRef.current?.focus();
    } catch {
      setCreateError("ERROR");
    } finally {
      setCreating(false);
    }
  }

  async function changeStatus(orderId: string, status: string) {
    // Optimistic update so the button feels instant on a busy counter.
    setQueue((previous) => ({
      ...previous,
      active: previous.active.map((order) =>
        order.id === orderId ? { ...order, status: status as PosOrder["status"] } : order,
      ),
    }));

    try {
      const response = await fetch(`/api/pos/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) await load();
      else void load();
    } catch {
      await load();
    }
  }

  async function rebuzzOrder(orderId: string) {
    setRebuzzingId(orderId);
    try {
      const response = await fetch(`/api/pos/orders/${orderId}/rebuzz`, {
        method: "POST",
      });
      if (response.ok) {
        setRebuzzSuccessId(orderId);
        setTimeout(() => setRebuzzSuccessId(null), 3000);
      }
    } catch {
      /* ignore */
    } finally {
      setRebuzzingId(null);
    }
  }

  const orders = view === "active" ? queue.active : queue.today;
  const todayCount = queue.today.length;
  const readyCount = useMemo(
    () => queue.active.filter((order) => order.status === "READY").length,
    [queue.active],
  );

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------ bar */}
      <section className="sb-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 1 ? (
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="sb-input !w-auto !py-2 text-sm font-semibold"
              aria-label={t["common.branch"]}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          ) : null}

          <div className="flex flex-1 items-center gap-4 text-sm">
            <span className="font-bold">
              {t["pos.ordersToday"]}: <span className="text-[var(--brand-primary)]">{todayCount}</span>
            </span>
            <span className="font-bold">
              {t["pos.markReady"]}: <span className="text-[var(--brand-secondary)]">{readyCount}</span>
            </span>
          </div>

          <span className="flex items-center gap-1.5 text-[0.68rem] font-bold text-[var(--muted)]">
            <span
              className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`}
              aria-hidden
            />
            {connected ? "LIVE" : "…"}
          </span>
        </div>
      </section>

      {/* --------------------------------------------------- new order form */}
      <section className="sb-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-[var(--muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t["pos.newOrder"]}
        </h2>

        <form onSubmit={createOrder} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="sb-label" htmlFor="order-number">
                {t["pos.orderNumber"]}
              </label>
              <input
                id="order-number"
                ref={numberRef}
                value={number}
                onChange={(event) => setNumber(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder={String(suggested)}
                className="sb-input text-center text-lg font-black"
              />
            </div>
            <div>
              <label className="sb-label" htmlFor="table-number">
                {t["pos.table"]}
              </label>
              <input
                id="table-number"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                className="sb-input"
                placeholder="—"
              />
            </div>
          </div>

          <div>
            <label className="sb-label" htmlFor="items-note">
              {t["pos.itemsNote"]}
            </label>
            <input
              id="items-note"
              value={itemsNote}
              onChange={(event) => setItemsNote(event.target.value)}
              placeholder={t["pos.itemsNotePlaceholder"]}
              className="sb-input"
            />
          </div>

          <div>
            <label className="sb-label" htmlFor="total-amount">
              {t["admin.price"]} ({currency})
            </label>
            <input
              id="total-amount"
              value={totalAmount}
              onChange={(event) => setTotalAmount(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="sb-input"
              placeholder="0"
            />
          </div>

          {createError ? (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-300">
              {createError}
            </p>
          ) : null}

          <button type="submit" disabled={creating} className="sb-btn sb-btn-primary w-full">
            {creating ? t["common.loading"] : t["pos.issueQr"]}
          </button>
        </form>
      </section>

      {/* --------------------------------------------------- issued QR code */}
      {issued ? (
        <section className="sb-ring-ready sb-fade-up rounded-3xl bg-emerald-500/10 p-5 text-center">
          <p className="text-sm font-extrabold text-emerald-300">
            {t["pos.created"]} — #{issued.number}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/public/qr/${issued.token}`}
            alt="QR"
            className="mx-auto mt-3 h-44 w-44 rounded-xl bg-white p-2"
          />
          <p className="mt-3 break-all font-mono text-[0.65rem] text-[var(--muted)]">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/${slug}/track?order=${issued.token}`}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a
              href={`/${slug}/pos/print/${issued.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sb-btn sb-btn-primary !py-2 text-sm"
            >
              {t["pos.printReceipt"]}
            </a>
            <a
              href={`/api/print/${issued.token}/escpos`}
              className="sb-btn sb-btn-ghost !py-2 text-sm"
            >
              ESC/POS
            </a>
            <button
              type="button"
              onClick={() => setIssued(null)}
              className="sb-btn sb-btn-ghost !py-2 text-sm"
            >
              {t["common.cancel"]}
            </button>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------- queue */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("active")}
            className={`sb-btn !px-3 !py-1.5 text-xs ${view === "active" ? "sb-btn-primary" : "sb-btn-ghost"}`}
          >
            {t["pos.activeOrders"]} ({queue.active.length})
          </button>
          <button
            type="button"
            onClick={() => setView("archive")}
            className={`sb-btn !px-3 !py-1.5 text-xs ${view === "archive" ? "sb-btn-primary" : "sb-btn-ghost"}`}
          >
            {t["pos.archive"]} ({queue.today.length})
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="sb-card p-8 text-center text-sm text-[var(--muted)]">
            {t["pos.noActiveOrders"]}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {orders.map((order) => (
              <li
                key={order.id}
                className={`sb-card p-4 ${
                  order.status === "READY" ? "sb-ring-ready !border-amber-400/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-3xl font-black leading-none">#{order.number}</p>
                      {order.pushCount && order.pushCount > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-black text-emerald-300"
                          title="إشعار شاشة القفل مفعل في هاتف الزبون"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {t["pos.pushSubscribed"]}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-amber-300/80"
                          title="بانتظار مسح الزبون للرمز من الإيصال"
                        >
                          {t["pos.pushWaiting"]}
                        </span>
                      )}
                    </div>
                    {order.tableNumber ? (
                      <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                        {t["common.branch"]}: {order.tableNumber}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold ${
                      order.status === "PREPARING"
                        ? "bg-sky-500/15 text-sky-300"
                        : order.status === "READY"
                          ? "bg-amber-500/20 text-amber-200"
                          : order.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {order.status === "READY" ? (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <span className="font-black text-amber-300">{t["pos.buzzingActive"]}</span>
                    </div>
                    <span className="font-mono text-amber-200/90 font-bold text-[0.7rem]">
                      {t["pos.buzzingSince"]} {formatElapsed(order.readyAt ?? order.createdAt, now)}
                    </span>
                  </div>
                ) : null}

                {order.itemsNote ? (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{order.itemsNote}</p>
                ) : null}

                <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="font-mono">{formatElapsed(order.createdAt, now)}</span>
                  {order.totalAmount > 0 ? (
                    <span className="font-bold text-[var(--brand-secondary)]">
                      {formatMoney(order.totalAmount, lang, currency)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={`/${slug}/pos/print/${order.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sb-btn sb-btn-ghost !py-2 !px-2.5 text-xs font-bold"
                    title={t["pos.printReceipt"]}
                  >
                    🖨️
                  </a>
                  {view === "active" ? (
                    <>
                      {order.status === "PREPARING" ? (
                        <button
                          type="button"
                          onClick={() => changeStatus(order.id, "READY")}
                          className="sb-btn sb-btn-warm flex-1 !py-2 text-sm"
                        >
                          {t["pos.markReady"]}
                        </button>
                      ) : null}
                      {order.status === "READY" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => rebuzzOrder(order.id)}
                            disabled={rebuzzingId === order.id}
                            className="sb-btn sb-btn-warm !py-2 !px-3 text-xs font-black shadow-md"
                            title="إرسال اهتزاز ورنين قوي مجدداً لهاتف الزبون"
                          >
                            {rebuzzSuccessId === order.id
                              ? t["pos.rebuzzSuccess"]
                              : rebuzzingId === order.id
                                ? "..."
                                : t["pos.rebuzz"]}
                          </button>
                          <button
                            type="button"
                            onClick={() => changeStatus(order.id, "COMPLETED")}
                            className="sb-btn sb-btn-primary flex-1 !py-2 text-sm"
                          >
                            {t["pos.markCompleted"]}
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => changeStatus(order.id, "CANCELLED")}
                        className="sb-btn sb-btn-danger !py-2 text-sm"
                      >
                        {t["pos.cancelOrder"]}
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
