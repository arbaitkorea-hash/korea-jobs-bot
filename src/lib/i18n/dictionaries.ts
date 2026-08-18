import "server-only";
import type { AppLocale } from "@/lib/i18n/config";

/**
 * Словари грузятся динамически и только на сервере — в клиентский бандл
 * не попадает ни один язык, даже неиспользуемый. Это часть бюджета Core Web Vitals.
 */
const dictionaries = {
  ru: () => import("./dictionaries/ru.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ko: () => import("./dictionaries/ko.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["ru"]>>;

export async function getDictionary(locale: AppLocale): Promise<Dictionary> {
  return dictionaries[locale]() as Promise<Dictionary>;
}
