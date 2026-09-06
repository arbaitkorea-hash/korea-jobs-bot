"use client";

import { createContext, useContext } from "react";
import type { Rates } from "@/lib/currency";

/**
 * Курсы валют для всего дерева страницы. Через контекст, а не пропсами:
 * цена встречается в карточке работы, на странице работы, в корзине и в
 * оформлении заказа — протаскивать курсы через каждый из них значило бы
 * менять сигнатуры половины компонентов ради одной таблицы чисел.
 */
const RatesContext = createContext<Rates>({});

export function RatesProvider({ rates, children }: { rates: Rates; children: React.ReactNode }) {
  return <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>;
}

export function useRates() {
  return useContext(RatesContext);
}
