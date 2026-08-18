import type { Metadata } from "next";
import { LOCALES, DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";
import { siteConfig } from "@/lib/site-config";

/**
 * hreflang для всех языковых версий страницы + x-default.
 *
 * `path` — часть URL после языкового префикса, начинается со слэша или пустая
 * (например "/gallery" или ""). Если у страницы разные slug'и на разных языках
 * (карточка картины, статья), передайте `slugByLocale` — тогда каждая
 * альтернатива укажет на свой реальный адрес, а не на несуществующий.
 */
export function buildAlternates(
  locale: AppLocale,
  path: string,
  slugByLocale?: Partial<Record<AppLocale, string>>,
): Metadata["alternates"] {
  const hrefFor = (loc: AppLocale): string | null => {
    if (slugByLocale) {
      const slug = slugByLocale[loc];
      if (!slug) return null; // перевода нет — не заявляем битый hreflang
      return `/${loc}${path}/${slug}`;
    }
    return `/${loc}${path}`;
  };

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    const href = hrefFor(loc);
    if (href) languages[loc] = href;
  }

  const defaultHref = hrefFor(DEFAULT_LOCALE);
  if (defaultHref) languages["x-default"] = defaultHref;

  const canonical = hrefFor(locale);

  return {
    ...(canonical ? { canonical } : {}),
    languages,
  };
}

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
