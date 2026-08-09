import { siteConfig } from "@/lib/site-config";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: Object.values(siteConfig.social),
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.artistName,
    url: `${siteConfig.url}/about`,
    jobTitle: "Artist / Painter",
    worksFor: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    sameAs: Object.values(siteConfig.social),
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
      item: `${siteConfig.url}${item.url}`,
    })),
  };
}

export function artworkJsonLd(artwork: {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  widthCm: number;
  heightCm: number;
  priceCents: number;
  currency: string;
  available: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    description: artwork.description,
    image: artwork.imageUrl,
    url: `${siteConfig.url}/gallery/${artwork.slug}`,
    artform: "Painting",
    artMedium: "Oil on canvas",
    width: {
      "@type": "QuantitativeValue",
      value: artwork.widthCm,
      unitCode: "CMT",
    },
    height: {
      "@type": "QuantitativeValue",
      value: artwork.heightCm,
      unitCode: "CMT",
    },
    creator: {
      "@type": "Person",
      name: siteConfig.artistName,
    },
    offers: {
      "@type": "Offer",
      price: (artwork.priceCents / 100).toFixed(2),
      priceCurrency: artwork.currency,
      availability: artwork.available
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url: `${siteConfig.url}/gallery/${artwork.slug}`,
    },
  };
}

export function productJsonLd(artwork: {
  slug: string;
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
    name: artwork.title,
    description: artwork.description,
    image: artwork.imageUrl,
    sku: artwork.slug,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      price: (artwork.priceCents / 100).toFixed(2),
      priceCurrency: artwork.currency,
      availability: artwork.available
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      url: `${siteConfig.url}/gallery/${artwork.slug}`,
    },
  };
}
