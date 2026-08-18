import type { Locale as PrismaLocale } from "@prisma/client";

/**
 * Языковые версии сайта. Каждая живёт на собственном URL-префиксе (/ru, /en, /ko) —
 * это принципиально для SEO: Google и Naver индексируют такие версии как отдельные
 * страницы, чего не даёт переключение текста на клиенте без смены адреса.
 */
export const LOCALES = ["ru", "en", "ko"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ru";

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Код для атрибута lang и hreflang. */
export const HTML_LANG: Record<AppLocale, string> = {
  ru: "ru",
  en: "en",
  ko: "ko",
};

/** Полные локали для Open Graph (og:locale). */
export const OG_LOCALE: Record<AppLocale, string> = {
  ru: "ru_RU",
  en: "en_US",
  ko: "ko_KR",
};

/** Подпись языка в переключателе — всегда на самом этом языке. */
export const LOCALE_LABEL: Record<AppLocale, string> = {
  ru: "Рус",
  en: "Eng",
  ko: "한국어",
};

/** Валюта отображения цен по языковой версии. */
export const LOCALE_CURRENCY: Record<AppLocale, string> = {
  ru: "KRW",
  en: "KRW",
  ko: "KRW",
};

/** Соответствие между локалью в URL и enum Locale в БД. */
export function toPrismaLocale(locale: AppLocale): PrismaLocale {
  return locale.toUpperCase() as PrismaLocale;
}

export function fromPrismaLocale(locale: PrismaLocale): AppLocale {
  return locale.toLowerCase() as AppLocale;
}
