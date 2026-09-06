import { prisma } from "@/lib/prisma";
import { rateKey, type Rates } from "@/lib/currency";

/**
 * Курсы одним плоским объектом — в таком виде их удобно передать в клиентский
 * компонент цены пропсом, не тащя туда Prisma.
 */
export async function getRates(): Promise<Rates> {
  const rows = await prisma.exchangeRate.findMany();
  const rates: Rates = {};
  for (const row of rows) rates[rateKey(row.base, row.quote)] = row.rate;
  return rates;
}
