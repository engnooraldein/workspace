"use client";

import { useState } from "react";

import { dict, type Lang } from "@/lib/i18n";

type Props = {
  token: string;
  lang: Lang;
  initialStars: number | null;
};

export default function RatingCard({ token, lang, initialStars }: Props) {
  const t = dict[lang];
  const [stars, setStars] = useState(initialStars ?? 0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    initialStars ? "done" : "idle",
  );

  async function submit() {
    if (stars < 1 || state === "sending") return;
    setState("sending");
    try {
      const response = await fetch(`/api/public/orders/${encodeURIComponent(token)}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, note: note.trim() || null }),
      });
      if (!response.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="sb-card sb-fade-up p-5 text-center">
        <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="font-extrabold text-emerald-300">{t["track.rateThanks"]}</p>
        {initialStars ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            {"★".repeat(initialStars)}
            <span className="text-[var(--line)]">{"★".repeat(5 - initialStars)}</span>
          </p>
        ) : null}
      </div>
    );
  }

  const shown = hovered || stars;

  return (
    <div className="sb-card sb-fade-up p-5">
      <h3 className="text-center text-base font-extrabold">{t["track.rateQuestion"]}</h3>

      <div className="mt-4 flex justify-center gap-1.5" role="radiogroup" aria-label={t["track.rateQuestion"]}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={stars === value}
            aria-label={`${value} ${t["track.starsLabel"]}`}
            onClick={() => setStars(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill={value <= shown ? "#fbbf24" : "transparent"}
              stroke={value <= shown ? "#fbbf24" : "var(--line)"}
              strokeWidth="1.8"
              strokeLinejoin="round"
            >
              <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t["track.ratePlaceholder"]}
        maxLength={500}
        rows={3}
        className="sb-input mt-4 resize-none"
      />

      {state === "error" ? (
        <p className="mt-2 text-center text-xs font-semibold text-rose-400">{t["track.rateError"]}</p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={stars < 1 || state === "sending"}
        className="sb-btn sb-btn-primary mt-3 w-full"
      >
        {state === "sending" ? t["common.loading"] : t["track.rateSubmit"]}
      </button>
    </div>
  );
}
