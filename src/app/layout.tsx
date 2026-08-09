import type { Metadata } from "next";
import { inter, playfair, notoSansKr, notoSerifKr } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import { ThemeScript } from "@/components/layout/theme-script";
import { organizationJsonLd, personJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.artistName}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  // hreflang для en/ko намеренно не заявлен: сайт пока одноязычный (ru), а
  // объявлять alternates на несуществующие /en и /ko — самому себе создавать
  // битые hreflang-ссылки. Когда появится i18n-роутинг, добавить сюда
  // `languages: { ru: "/", en: "/en", ko: "/ko" }`. См. SEO.md.
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${notoSerifKr.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={personJsonLd()} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
