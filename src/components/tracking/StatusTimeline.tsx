"use client";

import { dict, type Lang } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/realtime";

const STEPS: { status: OrderStatus; key: "track.status.preparing" | "track.status.ready" | "track.status.completed" }[] = [
  { status: "PREPARING", key: "track.status.preparing" },
  { status: "READY", key: "track.status.ready" },
  { status: "COMPLETED", key: "track.status.completed" },
];

function stepState(index: number, current: number): "done" | "active" | "pending" {
  if (index < current) return "done";
  if (index === current) return "active";
  return "pending";
}

export default function StatusTimeline({ status, lang }: { status: OrderStatus; lang: Lang }) {
  const t = dict[lang];
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.status === status),
  );
  const cancelled = status === "CANCELLED";

  return (
    <ol className="relative space-y-5">
      {STEPS.map((step, index) => {
        const state = cancelled ? "pending" : stepState(index, currentIndex);
        return (
          <li key={step.status} className="sb-step" data-state={state}>
            {index < STEPS.length - 1 ? <span className="sb-step-line" aria-hidden /> : null}
            <span className="sb-step-dot" aria-hidden>
              {state === "done" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <span className="text-xs font-black">{index + 1}</span>
              )}
            </span>
            <div className="pb-1 pt-1.5">
              <p
                className={`text-[0.95rem] font-bold leading-snug ${
                  state === "pending" ? "text-[var(--muted)]" : "text-[var(--foreground)]"
                }`}
              >
                {t[step.key]}
              </p>
              {state === "active" && status === "READY" ? (
                <p className="mt-1 text-xs font-semibold text-[var(--brand-secondary)]">
                  {t["track.readyBody"]}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
