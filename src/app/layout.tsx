import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "نظام النداء الذكي | Smart Buzzer",
  description:
    "منصة تتبع الطلبات للمطاعم والكافيهات — امسح رمز QR وتابع طلبك لحظياً حتى يجهز.",
  applicationName: "Smart Buzzer",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Smart Buzzer", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#060b16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

/**
 * Applies the stored language before first paint so the UI never flashes the
 * wrong direction. Keeps the root layout static (no cookies() call here).
 */
const LANG_BOOTSTRAP = `(function(){try{var m=document.cookie.match(/(?:^|; )sb_lang=([^;]+)/);var l=m?decodeURIComponent(m[1]):'ar';if(l!=='ar'&&l!=='en')l='ar';document.documentElement.lang=l;document.documentElement.dir=(l==='ar'?'rtl':'ltr');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
      </head>
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
