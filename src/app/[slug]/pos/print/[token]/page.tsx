import { notFound } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/db";
import { formatMoney, formatTime } from "@/lib/format";
import { buildTrackingUrl } from "@/lib/orders";
import { qrDataUrl } from "@/lib/qr";
import PrintTrigger from "./PrintTrigger";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; token: string }>;
};

export default async function ThermalReceiptPage({ params }: Props) {
  const { slug, token } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { tenant: true, branch: true },
  });

  if (!order || order.tenant.slug !== slug.toLowerCase()) {
    notFound();
  }

  const trackingUrl = buildTrackingUrl(order.tenant.slug, order.publicToken);
  const qrImage = await qrDataUrl(trackingUrl, { width: 300, margin: 1 });

  return (
    <div className="min-h-screen bg-slate-900 py-6 text-slate-900 print:bg-white print:py-0">
      {/* Non-print toolbar */}
      <div className="mx-auto mb-6 flex max-w-sm items-center justify-between gap-2 px-4 sb-no-print">
        <Link
          href={`/${slug}/pos`}
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
        >
          ← رجوع للكاشير
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/api/print/${token}/escpos`}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
          >
            ESC/POS
          </a>
          <PrintTrigger />
        </div>
      </div>

      {/* 80mm thermal receipt container */}
      <div className="mx-auto w-[80mm] max-w-full rounded-2xl bg-white p-5 shadow-2xl print:w-full print:max-w-none print:rounded-none print:p-2 print:shadow-none font-mono text-black text-center text-xs leading-relaxed">
        {/* Header */}
        <div className="border-b-2 border-dashed border-black pb-3">
          <h1 className="text-xl font-black uppercase tracking-tight">{order.tenant.name}</h1>
          {order.tenant.nameEn ? (
            <p className="text-[11px] font-semibold text-slate-700 uppercase">{order.tenant.nameEn}</p>
          ) : null}
          <p className="mt-1 text-[11px] font-medium">{order.branch.name}</p>
          {order.tenant.phone ? (
            <p className="text-[10px] text-slate-600">هاتف: {order.tenant.phone}</p>
          ) : null}
          {order.tenant.address ? (
            <p className="text-[10px] text-slate-600">{order.tenant.address}</p>
          ) : null}
        </div>

        {/* Order Number Showcase */}
        <div className="my-4 py-2 border-y-2 border-dashed border-black">
          <p className="text-xs font-bold uppercase tracking-wider">رقم الطلب / ORDER #</p>
          <p className="text-5xl font-black my-1 tracking-tight">#{order.number}</p>
          {order.tableNumber ? (
            <p className="text-sm font-bold bg-black text-white py-0.5 px-2 inline-block rounded">
              طاولة / Table: {order.tableNumber}
            </p>
          ) : (
            <p className="text-[11px] font-semibold">سفري / Takeaway</p>
          )}
        </div>

        {/* Order Details */}
        <div className="text-start space-y-1 py-2 border-b-2 border-dashed border-black">
          <div className="flex justify-between text-[11px]">
            <span>التاريخ / Date:</span>
            <span>{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Baghdad", dateStyle: "short" }).format(order.createdAt)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>الوقت / Time:</span>
            <span>{formatTime(order.createdAt, "ar")}</span>
          </div>
          {order.itemsNote ? (
            <div className="mt-2 pt-2 border-t border-dotted border-slate-400">
              <span className="font-bold text-[11px] block">الأصناف / Items:</span>
              <p className="text-[11px] whitespace-pre-wrap font-sans mt-0.5">{order.itemsNote}</p>
            </div>
          ) : null}
        </div>

        {/* Amount */}
        {order.totalAmount > 0 ? (
          <div className="py-2.5 flex justify-between items-center text-sm font-black border-b-2 border-dashed border-black">
            <span>المجموع / Total:</span>
            <span>{formatMoney(order.totalAmount, "ar", order.tenant.currency)}</span>
          </div>
        ) : null}

        {/* QR Code tracking box */}
        <div className="mt-4 pt-2">
          <p className="font-extrabold text-[12px]">امسح لتتبع طلبك لحظياً</p>
          <p className="text-[10px] font-semibold text-slate-700">Scan QR to track your order live</p>
          
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImage}
            alt={`Order #${order.number} Tracking QR`}
            className="mx-auto my-3 h-36 w-36 object-contain"
          />

          <p className="text-[9px] text-slate-500 break-all leading-tight font-sans">
            {trackingUrl}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-400 text-[10px] text-slate-600 space-y-0.5">
          <p className="font-bold">شكراً لزيارتكم! / Thank you for visiting!</p>
          <p>نظام النداء الذكي · Smart Buzzer</p>
        </div>
      </div>
    </div>
  );
}
