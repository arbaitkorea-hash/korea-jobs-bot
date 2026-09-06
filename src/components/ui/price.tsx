"use client";

import { useSyncExternalStore } from "react";
import type { AppLocale } from "@/lib/i18n/config";
import {
  convertCents,
  currencyForCountry,
  currencyForLocale,
  formatMoney,
  roundConverted,
} from "@/lib/currency";
import { useRates } from "@/lib/rates-context";

/**
 * Цена в валюте, понятной посетителю.
 *
 * Сервер рендерит валюту языка страницы — так цена корректна и без JavaScript,
 * и её видит поисковик. Уже в браузере, если по стране посетителя ясно, что
 * валюта другая (кука ставится в proxy.ts), цифра заменяется на пересчитанную.
 * Пересчёт помечен знаком «≈» и подписан исходной ценой: продаётся картина
 * всё-таки за ту сумму, которую назначил художник.
 */
function subscribeNever() {
  return () => {};
}

function readCountryCookie(): string | null {
  return document.cookie.match(/(?:^|;\s*)jst_country=([A-Z]{2})/)?.[1] ?? null;
}

export function Price({
  cents,
  currency,
  locale,
  className,
  showBase = false,
}: {
  cents: number;
  currency: string;
  locale: AppLocale;
  className?: string;
  /** Показать исходную цену второй строкой (на карточке работы, в корзине). */
  showBase?: boolean;
}) {
  const rates = useRates();

  // Кука — внешнее по отношению к React хранилище, и читается она именно так:
  // на сервере снимок пустой (страны не знаем), после гидратации React сам
  // перерисует цену с уже прочитанным значением. Подписка пустая — кука
  // за время жизни страницы не меняется.
  const country = useSyncExternalStore(subscribeNever, readCountryCookie, () => null);
  const displayCurrency = currencyForCountry(country) ?? currencyForLocale(locale);

  const converted =
    displayCurrency === currency ? cents : convertCents(cents, currency, displayCurrency, rates);

  // Курса нет — показываем цену как есть. Лучше «24 000 ₽» кому-то в Сеуле,
  // чем правдоподобная, но выдуманная сумма в вонах.
  if (converted === null) {
    return <span className={className}>{formatMoney(cents, currency, locale)}</span>;
  }

  if (displayCurrency === currency) {
    return <span className={className}>{formatMoney(cents, currency, locale)}</span>;
  }

  const rounded = roundConverted(converted, displayCurrency);

  return (
    <span className={className}>
      ≈ {formatMoney(rounded, displayCurrency, locale)}
      {showBase && (
        <span className="ml-2 text-sm text-fg-muted">{formatMoney(cents, currency, locale)}</span>
      )}
    </span>
  );
}
