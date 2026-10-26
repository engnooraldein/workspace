import QRCode from "qrcode";

export type QrOptions = {
  width?: number;
  margin?: number;
  dark?: string;
  light?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
};

/** Inline data URL — embedded directly in the POS card, no extra HTTP request. */
export async function qrDataUrl(text: string, options: QrOptions = {}): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options.width ?? 512,
    margin: options.margin ?? 1,
    errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
    color: {
      dark: options.dark ?? "#0f172a",
      light: options.light ?? "#ffffff",
    },
  });
}

/** PNG bytes — used by the thermal print endpoint and the receipt page. */
export async function qrPng(text: string, options: QrOptions = {}): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width: options.width ?? 512,
    margin: options.margin ?? 1,
    errorCorrectionLevel: options.errorCorrectionLevel ?? "M",
    color: {
      dark: options.dark ?? "#000000",
      light: options.light ?? "#ffffff",
    },
  });
}
