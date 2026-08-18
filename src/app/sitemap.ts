import type { MetadataRoute } from "next";
import { LOCALES, DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";
import { getArtworkSitemapEntries } from "@/lib/data/artworks";
import { getCollectionSitemapEntries } from "@/lib/data/collections";
import { getBlogSitemapEntries } from "@/lib/data/blog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/** Статические разделы, одинаковые во всех языковых версиях. */
const STATIC_PATHS: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/gallery", priority: 0.9, changeFrequency: "daily" },
  { path: "/collections", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
  { path: "/shipping", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/policies/returns", priority: 0.2, changeFrequency: "yearly" },
  { path: "/policies/privacy", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * Каждая запись содержит `alternates.languages` — так поисковик видит связь
 * языковых версий прямо в карте сайта, не разбирая HTML каждой страницы.
 */
function languagesFor(build: (locale: AppLocale) => string | null) {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    const href = build(locale);
    if (href) languages[locale] = href;
  }
  const fallback = build(DEFAULT_LOCALE);
  if (fallback) languages["x-default"] = fallback;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, collections, posts] = await Promise.all([
    getArtworkSitemapEntries(),
    getCollectionSitemapEntries(),
    getBlogSitemapEntries(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of STATIC_PATHS) {
    const languages = languagesFor((locale) => absoluteUrl(`/${locale}${path}`));
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  }

  const pushLocalized = (
    section: string,
    rows: { updatedAt: Date; slugByLocale: Partial<Record<AppLocale, string>> }[],
    priority: number,
    changeFrequency: "weekly" | "monthly",
  ) => {
    for (const row of rows) {
      const languages = languagesFor((locale) => {
        const slug = row.slugByLocale[locale];
        return slug ? absoluteUrl(`/${locale}${section}/${slug}`) : null;
      });

      for (const locale of LOCALES) {
        const slug = row.slugByLocale[locale];
        if (!slug) continue;
        entries.push({
          url: absoluteUrl(`/${locale}${section}/${slug}`),
          lastModified: row.updatedAt,
          changeFrequency,
          priority,
          alternates: { languages },
        });
      }
    }
  };

  pushLocalized("/gallery", artworks, 0.8, "weekly");
  pushLocalized("/collections", collections, 0.6, "weekly");
  pushLocalized("/blog", posts, 0.5, "monthly");

  return entries;
}
