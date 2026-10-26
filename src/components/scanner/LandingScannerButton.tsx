"use client";

import { useState } from "react";
import QrScannerModal from "./QrScannerModal";

export default function LandingScannerButton({ lang = "ar" }: { lang?: "ar" | "en" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sb-btn sb-btn-warm !py-2.5 !px-5 text-sm font-black shadow-xl shadow-amber-500/20"
      >
        📷 {lang === "ar" ? "مسح باركود الإيصال بالكاميرا" : "Scan Barcode with Camera"}
      </button>

      <QrScannerModal isOpen={open} onClose={() => setOpen(false)} lang={lang} />
    </>
  );
}
