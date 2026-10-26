"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    // Attempt automatic print dialog once page finishes rendering
    const timer = setTimeout(() => {
      try {
        window.print();
      } catch {
        /* Ignore if blocked by browser policy */
      }
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-black text-slate-950 transition hover:bg-cyan-400"
    >
      🖨️ طباعة الآن (Print)
    </button>
  );
}
