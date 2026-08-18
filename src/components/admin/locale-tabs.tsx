"use client";

import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LABEL: Record<AppLocale, string> = {
  ru: "Русский",
  en: "English",
  ko: "한국어",
};

/**
 * Переключатель языка редактирования. Рядом с каждым языком — точка-индикатор
 * заполненности, чтобы владелец сразу видел, где перевод ещё не готов,
 * не открывая каждую вкладку.
 */
export function LocaleTabs({
  active,
  onChange,
  completeness,
}: {
  active: AppLocale;
  onChange: (locale: AppLocale) => void;
  completeness: Record<AppLocale, "green" | "yellow" | "red">;
}) {
  const dot = { green: "bg-emerald-600", yellow: "bg-amber-500", red: "bg-red-600" };

  return (
    <div className="flex gap-1 border-b border-border">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          aria-selected={locale === active}
          role="tab"
          className={cn(
            "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors",
            locale === active
              ? "border-fg text-fg"
              : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", dot[completeness[locale]])} aria-hidden />
          {LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
