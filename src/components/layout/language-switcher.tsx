"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABEL, type AppLocale } from "@/lib/i18n/config";
import { useAlternates } from "@/lib/i18n/alternates-context";
import { cn } from "@/lib/utils";

/** Разделы, у которых последний сегмент — переводимый slug. */
const SLUGGED_SECTIONS = new Set(["gallery", "collections", "blog"]);

/**
 * Переключатель языка сохраняет текущую страницу: /en/gallery → /ko/gallery.
 *
 * У карточек работ и статей slug свой на каждом языке, поэтому простая подмена
 * префикса дала бы 404. Такие страницы регистрируют реальные адреса переводов
 * через <SetAlternates/>. Пока контекст не заполнен (первый рендер до гидратации)
 * откатываемся на список раздела — он существует всегда, битой ссылки не будет.
 */
export function LanguageSwitcher({ locale, label }: { locale: AppLocale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const alternates = useAlternates();

  function hrefFor(target: AppLocale): string {
    if (alternates) {
      const slug = alternates.slugByLocale[target];
      return slug
        ? `/${target}${alternates.sectionPath}/${slug}`
        : `/${target}${alternates.sectionPath}`;
    }

    const segments = pathname.split("/").filter(Boolean); // ["ru","gallery","slug"]
    const [, section] = segments;
    if (segments.length >= 3 && section && SLUGGED_SECTIONS.has(section)) {
      return `/${target}/${section}`;
    }
    return `/${target}${pathname.replace(/^\/[^/]+/, "")}`;
  }

  return (
    <nav aria-label={label} className="flex items-center gap-0.5 text-xs">
      {LOCALES.map((target) => (
        <Link
          key={target}
          href={hrefFor(target)}
          hrefLang={target}
          aria-current={target === locale ? "true" : undefined}
          className={cn(
            "rounded-full px-2 py-1 transition-colors",
            target === locale ? "text-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {LOCALE_LABEL[target]}
        </Link>
      ))}
    </nav>
  );
}
