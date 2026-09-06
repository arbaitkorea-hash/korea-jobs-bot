import type { AppLocale } from "@/lib/i18n/config";

/**
 * Валюты, в которых сайт умеет показывать цену. Базовая — та, в которой
 * владелец назначил цену работе (в каталоге это рубли); остальные считаются
 * по курсу из админки и показываются со знаком «≈».
 */
export const CURRENCIES = ["RUB", "KRW", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/**
 * Валюта по стране посетителя (ISO-3166 alpha-2 из geo-заголовка хостинга).
 *
 * Список стран короткий намеренно: он покрывает рынки, на которые сайт
 * рассчитан, а всем остальным показываем доллар — это понятная всем единица
 * измерения, в отличие от воны или рубля.
 */
const COUNTRY_CURRENCY: Record<string, Currency> = {
  KR: "KRW",
  RU: "RUB",
  BY: "RUB",
  KZ: "RUB",
  KG: "RUB",
  AM: "RUB",
  UZ: "RUB",
  TJ: "RUB",
};

export function currencyForCountry(country: string | null | undefined): Currency | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? "USD";
}

/**
 * Валюта по языку страницы — то, что рендерится на сервере и попадает в
 * статический HTML. Страна известна только в момент запроса, а страницы у нас
 * закешированы, поэтому язык здесь — честное приближение: кто читает
 * корейскую версию, скорее всего платит в вонах.
 */
export function currencyForLocale(locale: AppLocale): Currency {
  return locale === "ko" ? "KRW" : locale === "en" ? "USD" : "RUB";
}

export type Rates = Partial<Record<string, number>>;

/** Ключ курса: "RUB>KRW". Плоская строка, чтобы удобно класть в JSON пропсы. */
export function rateKey(base: string, quote: string) {
  return `${base}>${quote}`;
}

/**
 * Пересчёт цены. Возвращает null, если курса нет: показать неверную цену на
 * картину за десятки тысяч — хуже, чем показать её в исходной валюте.
 */
export function convertCents(
  cents: number,
  from: string,
  to: string,
  rates: Rates,
): number | null {
  if (from === to) return cents;

  const direct = rates[rateKey(from, to)];
  if (direct) return Math.round(cents * direct);

  const inverse = rates[rateKey(to, from)];
  if (inverse) return Math.round(cents / inverse);

  // Кросс-курс через базовую валюту: RUB→KRW и RUB→USD дают USD→KRW.
  for (const key of Object.keys(rates)) {
    const [base, quote] = key.split(">");
    if (quote !== from) continue;
    const toBase = rates[rateKey(base, to)];
    if (toBase) return Math.round((cents / rates[key]!) * toBase);
  }

  return null;
}

const INTL_LOCALE: Record<AppLocale, string> = { ru: "ru-RU", en: "en-US", ko: "ko-KR" };

/**
 * Цены на живопись всегда круглые, дробная часть в них — визуальный шум.
 * Воны вдобавок вообще не имеют копеек.
 */
export function formatMoney(cents: number, currency: string, locale: AppLocale) {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Округление пересчитанной цены вверх до «красивой» ступени. */
export function roundConverted(cents: number, currency: string): number {
  // Шаг подобран под порядок цифр: у воны цена шестизначная, у доллара — трёхзначная.
  const step = currency === "KRW" ? 1000_00 : currency === "RUB" ? 100_00 : 5_00;
  return Math.round(cents / step) * step;
}
