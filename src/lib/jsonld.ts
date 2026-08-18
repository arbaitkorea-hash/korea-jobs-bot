import { siteConfig } from "@/lib/site-config";
import type { AppLocale } from "@/lib/i18n/config";
import { absoluteUrl } from "@/lib/seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.png"),
    sameAs: Object.values(siteConfig.social),
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.artistName,
    alternateName: siteConfig.artistNameKo,
    url: absoluteUrl("/ru/about"),
    jobTitle: "Artist",
    knowsAbout: ["Oil painting", "Acrylic painting", "Landscape art"],
    worksFor: { "@type": "Organization", name: siteConfig.name },
    sameAs: Object.values(siteConfig.social),
  };
}

/** WebSite + SearchAction — даёт поиск по сайту прямо в выдаче Google. */
export function webSiteJsonLd(locale: AppLocale, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    publisher: { "@type": "Organization", name: siteConfig.name },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl(`/${locale}/gallery?q={search_term_string}`),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

type ArtworkJsonLdInput = {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  widthCm: number;
  heightCm: number;
  priceCents: number;
  currency: string;
  available: boolean;
  technique: string;
  year: number | null;
  locale: AppLocale;
  keywords: string;
};

export function artworkJsonLd(a: ArtworkJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: a.title,
    description: a.description,
    image: a.imageUrl,
    url: absoluteUrl(a.url),
    inLanguage: a.locale,
    artform: "Painting",
    artMedium: a.technique,
    artworkSurface: "Canvas",
    ...(a.year ? { dateCreated: String(a.year) } : {}),
    ...(a.keywords ? { keywords: a.keywords } : {}),
    width: { "@type": "QuantitativeValue", value: a.widthCm, unitCode: "CMT" },
    height: { "@type": "QuantitativeValue", value: a.heightCm, unitCode: "CMT" },
    creator: {
      "@type": "Person",
      name: siteConfig.artistName,
      alternateName: siteConfig.artistNameKo,
    },
    offers: {
      "@type": "Offer",
      price: (a.priceCents / 100).toFixed(2),
      priceCurrency: a.currency,
      availability: a.available
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url: absoluteUrl(a.url),
    },
  };
}

export function productJsonLd(a: {
  url: string;
  sku: string;
  title: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  currency: string;
  available: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: a.title,
    description: a.description,
    image: a.imageUrl,
    sku: a.sku,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      price: (a.priceCents / 100).toFixed(2),
      priceCurrency: a.currency,
      availability: a.available
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url: absoluteUrl(a.url),
    },
  };
}

export function articleJsonLd(p: {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  publishedAt: Date | null;
  locale: AppLocale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    ...(p.imageUrl ? { image: p.imageUrl } : {}),
    url: absoluteUrl(p.url),
    inLanguage: p.locale,
    ...(p.publishedAt ? { datePublished: p.publishedAt.toISOString() } : {}),
    author: { "@type": "Person", name: siteConfig.artistName },
    publisher: { "@type": "Organization", name: siteConfig.name },
  };
}
