import { prisma } from "@/lib/prisma";
import { RatesForm } from "@/components/admin/rates-form";
import type { RateInput } from "@/app/(admin)/admin/(dashboard)/rates/actions";

export const metadata = { title: "Курсы валют" };

/**
 * Пересчитываем только из рубля: цены работ назначены в рублях, а вона и
 * доллар — то, что видит покупатель в Сеуле и за пределами обеих стран.
 * Обратные направления не нужны — кросс-курс считается из этих двух.
 */
const PAIRS: [string, string][] = [
  ["RUB", "KRW"],
  ["RUB", "USD"],
];

export default async function AdminRatesPage() {
  const stored = await prisma.exchangeRate.findMany();

  const initial: RateInput[] = PAIRS.map(([base, quote]) => {
    const row = stored.find((r) => r.base === base && r.quote === quote);
    return { base, quote, rate: row ? String(row.rate) : "" };
  });

  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl">Курсы валют</h1>
      <p className="mb-8 max-w-2xl text-fg-muted">
        Цена работы задаётся в рублях. Посетителю из Кореи она показывается в вонах,
        остальным — в долларах; валюта определяется по стране, а если она неизвестна —
        по языку страницы.
      </p>
      <RatesForm initial={initial} />
    </div>
  );
}
