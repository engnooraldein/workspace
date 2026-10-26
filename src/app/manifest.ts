import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نظام النداء الذكي | Smart Buzzer",
    short_name: "Smart Buzzer",
    description: "منصة تتبع الطلبات للمطاعم والكافيهات — تنبيه لحظي عند جاهزية الطلب",
    start_url: "/",
    display: "standalone",
    background_color: "#060b16",
    theme_color: "#22d3ee",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/brand/logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
