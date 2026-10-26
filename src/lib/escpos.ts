/**
 * ESC/POS command builder for 58 mm / 80 mm thermal receipt printers.
 *
 * Two delivery paths are supported:
 *   1. `/api/print/[token]/escpos` returns the raw byte stream — pipe it into a
 *      print bridge (qz-print / printNode / a local socket agent).
 *   2. The browser print window renders the same receipt as HTML, which handles
 *      Arabic text correctly on any printer driver.
 *
 * NOTE: Arabic glyphs need a printer with Arabic/code-page support. The byte
 * stream below therefore keeps the critical information (order number, table)
 * numeric/ASCII, and emits Arabic lines as an optional extra block.
 */

const ESC = 0x1b;
const GS = 0x1d;

export type EscPosWidth = 58 | 80;

export type EscPosOptions = {
  width?: EscPosWidth;
  moduleSize?: number; // 1..16, each unit = 0.5 mm
  errorCorrection?: "L" | "M" | "Q" | "H";
  includeArabic?: boolean;
  cut?: boolean;
};

export type ReceiptLine =
  | { type: "text"; value: string; align?: "left" | "center" | "right"; bold?: boolean; double?: boolean }
  | { type: "qr"; value: string }
  | { type: "feed"; lines?: number }
  | { type: "divider" }
  | { type: "cut" };

function align(n: 0 | 1 | 2): number[] {
  return [ESC, 0x61, n];
}

function bold(on: boolean): number[] {
  return [ESC, 0x45, on ? 1 : 0];
}

function printMode(options: { bold?: boolean; double?: boolean }): number[] {
  let n = 0;
  if (options.bold) n |= 0b0000_0001;
  if (options.double) n |= 0b0001_1000; // double height + double width
  return [ESC, 0x21, n];
}

function feed(lines = 1): number[] {
  return [ESC, 0x64, lines];
}

function divider(width: EscPosWidth): number[] {
  const count = width === 58 ? 32 : 48;
  return [...align(1), ...printMode({}), ...Buffer.from("-".repeat(count), "ascii"), ...align(0)];
}

function qrModel2(value: string, moduleSize: number, errorCorrection: "L" | "M" | "Q" | "H"): number[] {
  const payload = Buffer.from(value, "utf8");

  const symbol = Buffer.from([0x31, 0x41, 0x32, 0x00]); // model 2, 8-bit byte mode
  const length = Buffer.from([payload.length & 0xff, (payload.length >> 8) & 0xff]);
  const data = Buffer.concat([symbol, length, payload, Buffer.from([0x00])]);

  const pL = data.length & 0xff;
  const pH = (data.length >> 8) & 0xff;

  const ecMap = { L: 48, M: 49, Q: 50, H: 51 } as const;

  return [
    GS, 0x28, 0x6b, 0x03, 0x00, 49, 65, 0x02, 0x00, // model 2 symbol
    GS, 0x28, 0x6b, 0x03, 0x00, 49, 67, moduleSize, 0x00, // module size
    GS, 0x28, 0x6b, 0x03, 0x00, 49, 69, ecMap[errorCorrection], 0x00, // error correction
    GS, 0x28, 0x6b, pL, pH, 49, 80, 48, 0x00, ...data, // store data
    GS, 0x28, 0x6b, 0x03, 0x00, 49, 81, 48, 0x00, // print symbol
  ];
}

/** Builds the raw ESC/POS byte stream for a receipt. */
export function buildEscPos(lines: ReceiptLine[], options: EscPosOptions = {}): Buffer {
  const width: EscPosWidth = options.width ?? 58;
  const out: number[] = [];

  // Initialise printer + Arabic-capable code page (best effort)
  out.push(ESC, 0x40); // ESC @  (initialise)
  out.push(ESC, 0x74, 0x03); // ESC t 3  (code page 860 / Arabic-capable on many printers)

  for (const line of lines) {
    switch (line.type) {
      case "text": {
        out.push(...align(line.align === "center" ? 1 : line.align === "right" ? 2 : 0));
        out.push(...bold(!!line.bold));
        out.push(...printMode({ double: !!line.double }));
        const text = Buffer.from(line.value, "utf8");
        out.push(...text);
        out.push(0x0a);
        break;
      }
      case "qr": {
        out.push(...align(1));
        out.push(...qrModel2(line.value, options.moduleSize ?? 6, options.errorCorrection ?? "M"));
        out.push(...feed(1));
        break;
      }
      case "feed":
        out.push(...feed(line.lines ?? 1));
        break;
      case "divider":
        out.push(...divider(width));
        out.push(0x0a);
        break;
      case "cut":
        out.push(GS, 0x56, 0x42); // GS V 66  (partial cut with feed)
        break;
    }
  }

  out.push(...feed(3));

  if (options.cut !== false) {
    out.push(GS, 0x56, 0x42);
  }

  return Buffer.from(out);
}

/** Builds the standard order receipt lines. */
export function receiptLines(params: {
  restaurantName: string;
  restaurantNameEn?: string | null;
  orderNumber: number;
  tableNumber?: string | null;
  itemsNote?: string | null;
  totalAmount?: number;
  trackingUrl: string;
  createdAt: Date;
  includeArabic?: boolean;
}): ReceiptLine[] {
  const lines: ReceiptLine[] = [];

  lines.push({ type: "text", value: params.restaurantName, align: "center", bold: true, double: true });
  if (params.restaurantNameEn) {
    lines.push({ type: "text", value: params.restaurantNameEn, align: "center" });
  }
  lines.push({ type: "divider" });

  lines.push({ type: "text", value: `Order #${params.orderNumber}`, align: "center", bold: true, double: true });
  if (params.tableNumber) {
    lines.push({ type: "text", value: `Table ${params.tableNumber}`, align: "center" });
  }
  lines.push({ type: "text", value: params.createdAt.toISOString().slice(0, 16).replace("T", " "), align: "center" });
  lines.push({ type: "divider" });

  if (params.itemsNote) {
    for (const item of params.itemsNote.split(/[,\n]/).map((part) => part.trim()).filter(Boolean)) {
      lines.push({ type: "text", value: item });
    }
    lines.push({ type: "divider" });
  }

  if (params.totalAmount && params.totalAmount > 0) {
    lines.push({ type: "text", value: `TOTAL: ${params.totalAmount} IQD`, align: "right", bold: true });
    lines.push({ type: "divider" });
  }

  lines.push({ type: "text", value: "Scan to track your order", align: "center" });
  lines.push({ type: "qr", value: params.trackingUrl });
  lines.push({ type: "feed", lines: 1 });
  lines.push({ type: "text", value: params.trackingUrl, align: "center" });
  lines.push({ type: "feed", lines: 1 });
  lines.push({ type: "text", value: "Thank you!", align: "center", bold: true });

  if (params.includeArabic) {
    lines.push({ type: "feed", lines: 1 });
    lines.push({ type: "text", value: "رقم الطلب", align: "center" });
    lines.push({ type: "text", value: String(params.orderNumber), align: "center", bold: true, double: true });
    lines.push({ type: "text", value: "امسح الرمز لمتابعة طلبك", align: "center" });
  }

  return lines;
}
