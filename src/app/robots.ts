import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { LOCALES } from "@/lib/i18n/config";

export default function robots(): MetadataRoute.Robots {
  // Корзина и оформление заказа есть в каждой языковой версии — закрываем все.
  const localizedPrivate = LOCALES.flatMap((locale) => [
    `/${locale}/cart`,
    `/${locale}/checkout`,
  ]);

  return {
    rules: [
      {
        // Naver использует собственных ботов (Yeti), но правила читает из
        // того же robots.txt — отдельная секция не нужна, достаточно "*".
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", ...localizedPrivate],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(""),
  };
}
