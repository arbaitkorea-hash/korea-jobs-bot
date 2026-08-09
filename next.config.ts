import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Публичное хранилище медиа в проде — задаётся через env при деплое,
      // если для загрузок используется внешний S3-совместимый бакет вместо
      // локального /api/media (см. src/lib/storage.ts).
      ...(process.env.MEDIA_HOSTNAME
        ? [{ protocol: "https" as const, hostname: process.env.MEDIA_HOSTNAME }]
        : []),
    ],
  },
  // Заголовки безопасности (CSP, HSTS и т.д.) заданы в src/proxy.ts.
};

export default nextConfig;
