import { computeSeoHealth, type SeoFields } from "@/lib/seo-health";
import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const DOT = { green: "bg-emerald-600", yellow: "bg-amber-500", red: "bg-red-600" };
const LABEL = { green: "заполнено", yellow: "частично", red: "не заполнено" };

/** Компактный «светофор» SEO по каждому языку — для списков в админке. */
export function LocaleSeoDots({
  byLocale,
  requireAlt = true,
}: {
  byLocale: Record<string, SeoFields>;
  requireAlt?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      SEO:
      {LOCALES.map((locale: AppLocale) => {
        const health = computeSeoHealth(byLocale[locale] ?? {}, requireAlt);
        return (
          <span
            key={locale}
            className="inline-flex items-center gap-1"
            title={`${locale.toUpperCase()}: ${LABEL[health]}`}
          >
            <span className={cn("h-2 w-2 rounded-full", DOT[health])} aria-hidden />
            {locale.toUpperCase()}
          </span>
        );
      })}
    </span>
  );
}
