import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-tenant + realtime app: every request is tenant/role scoped and dynamic.
  // `cacheComponents` is intentionally left OFF so that `force-dynamic` routes
  // (tenant branding, POS queue, SSE) behave predictably across hosts.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
