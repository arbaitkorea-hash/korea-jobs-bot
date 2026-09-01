import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { inter, playfair, notoSansKr, notoSerifKr } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import { LOCALES, HTML_LANG, OG_LOCALE, isAppLocale, type AppLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ThemeScript } from "@/components/layout/theme-script";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/lib/cart-context";
import { AlternatesProvider } from "@/lib/i18n/alternates-context";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, personJsonLd, webSiteJsonLd } from "@/lib/jsonld";
import { buildAlternates } from "@/lib/seo";
import "@/app/globals.css";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isAppLocale(lang)) return {};

  const dict = await getDictionary(lang);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: dict.meta.siteTitle,
      template: `%s | ${dict.meta.titleSuffix}`,
    },
    description: dict.meta.siteDescription,
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      siteName: siteConfig.name,
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      // Картинку здесь не задаём: явное значение в layout перекрывает
      // файловую обложку opengraph-image.tsx на вложенных страницах,
      // и все разделы получили бы одну статичную заглушку.
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
    },
    alternates: buildAlternates(lang, ""),
    robots: { index: true, follow: true },
  };
}

export default async function PublicRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isAppLocale(lang)) notFound();

  const locale: AppLocale = lang;
  const dict = await getDictionary(locale);

  return (
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${notoSerifKr.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        {/* Naver ранжирует по собственным мета-тегам и не читает og: так же, как Google.
            Тег верификации выводим только когда код реально задан — пустой content
            Naver считает невалидным. */}
        {siteConfig.naverSiteVerification && (
          <meta name="naver-site-verification" content={siteConfig.naverSiteVerification} />
        )}
        <meta name="author" content={siteConfig.artistName} />
        <meta name="subject" content={dict.meta.siteDescription} />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={personJsonLd()} />
        <JsonLd data={webSiteJsonLd(locale, dict.meta.siteTitle)} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <AlternatesProvider>
          <CartProvider>
            <SiteHeader locale={locale} dict={dict} />
            <main className="flex-1">{children}</main>
            <SiteFooter locale={locale} dict={dict} />
          </CartProvider>
        </AlternatesProvider>
      </body>
    </html>
  );
}
