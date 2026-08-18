"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppLocale } from "@/lib/i18n/config";

export type Alternates = {
  sectionPath: string; // например "/gallery"
  slugByLocale: Partial<Record<AppLocale, string>>;
};

type Ctx = {
  alternates: Alternates | null;
  setAlternates: (value: Alternates | null) => void;
};

const AlternatesContext = createContext<Ctx>({ alternates: null, setAlternates: () => {} });

/**
 * Провайдер живёт в layout, поэтому и шапка, и содержимое страницы — его потомки.
 * Страница с переводимым slug регистрирует свои адреса через <SetAlternates/>,
 * а переключатель языка в шапке их читает.
 */
export function AlternatesProvider({ children }: { children: ReactNode }) {
  const [alternates, setAlternates] = useState<Alternates | null>(null);
  const value = useMemo(() => ({ alternates, setAlternates }), [alternates]);
  return <AlternatesContext.Provider value={value}>{children}</AlternatesContext.Provider>;
}

export function useAlternates() {
  return useContext(AlternatesContext).alternates;
}

/** Рендерится страницей картины/статьи/коллекции. Ничего не выводит. */
export function SetAlternates({ sectionPath, slugByLocale }: Alternates) {
  const { setAlternates } = useContext(AlternatesContext);
  const key = JSON.stringify(slugByLocale);

  useEffect(() => {
    setAlternates({ sectionPath, slugByLocale: JSON.parse(key) });
    return () => setAlternates(null);
  }, [sectionPath, key, setAlternates]);

  return null;
}
