"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lang?: "ar" | "en";
};

export default function QrScannerModal({ isOpen, onClose, lang = "ar" }: Props) {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setIsScanning(false);
        }).catch(() => {});
      }
      return;
    }

    const elementId = "qr-reader-container";

    // Initialize scanner once modal opens
    const timer = setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback - vibrate phone for feedback
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate([100, 50, 100]);
            }

            // Stop scanner
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
              scannerRef.current = null;
              setIsScanning(false);
            }).catch(() => {});

            onClose();

            // Check if scanned text is full URL or token
            if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
              try {
                const url = new URL(decodedText);
                router.push(url.pathname + url.search);
              } catch {
                window.location.href = decodedText;
              }
            } else if (decodedText.includes("/track?order=")) {
              router.push(decodedText);
            } else {
              // Direct token, route through current slug or track
              router.push(`/track?order=${encodeURIComponent(decodedText)}`);
            }
          },
          () => {
            // Scan failure per-frame (normal when searching for QR)
          }
        );

        setIsScanning(true);
        setErrorMsg(null);
      } catch (err: unknown) {
        console.error("Camera access error:", err);
        setErrorMsg(
          lang === "ar"
            ? "تعذر فتح الكاميرا. يرجى التأكد من منح الإذن لاستخدام الكاميرا."
            : "Could not open camera. Please ensure camera permissions are granted."
        );
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          setIsScanning(false);
        }).catch(() => {});
      }
    };
  }, [isOpen, onClose, router, lang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="sb-card relative w-full max-w-sm overflow-hidden p-5 text-center shadow-2xl border-[var(--brand-primary)]/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="text-sm font-black text-white">
              {lang === "ar" ? "مسح باركود الإيصال" : "Scan Receipt Barcode"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--muted)] hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative my-4 flex items-center justify-center rounded-2xl bg-black overflow-hidden aspect-square border border-[var(--line)]">
          <div id="qr-reader-container" className="w-full h-full" />

          {/* Futuristic HUD overlay */}
          <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-cyan-400/60 rounded-xl flex items-center justify-center">
            {/* Corner accents */}
            <span className="absolute -top-1 -start-1 h-4 w-4 border-t-2 border-s-2 border-cyan-400" />
            <span className="absolute -top-1 -end-1 h-4 w-4 border-t-2 border-e-2 border-cyan-400" />
            <span className="absolute -bottom-1 -start-1 h-4 w-4 border-b-2 border-s-2 border-cyan-400" />
            <span className="absolute -bottom-1 -end-1 h-4 w-4 border-b-2 border-e-2 border-cyan-400" />

            {/* Scanning line animation */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-pulse" />
          </div>
        </div>

        {errorMsg ? (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs font-bold text-rose-300">
            {errorMsg}
          </p>
        ) : (
          <p className="text-xs text-[var(--muted)] font-medium">
            {lang === "ar"
              ? "وجّه الكاميرا نحو رمز الـ QR المطبوع على إيصال الطلب"
              : "Point your camera at the QR code on your receipt"}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="sb-btn sb-btn-ghost w-full !py-2 text-xs"
          >
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
