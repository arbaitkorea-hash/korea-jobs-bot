import { computeSeoHealth, type SeoHealth } from "@/lib/seo-health";
import { cn } from "@/lib/utils";

const LABEL: Record<SeoHealth, string> = {
  green: "SEO заполнено",
  yellow: "SEO частично",
  red: "SEO не заполнено",
};

const COLOR: Record<SeoHealth, string> = {
  green: "bg-emerald-600",
  yellow: "bg-amber-500",
  red: "bg-red-600",
};

export function SeoHealthBadge({
  seoTitle,
  seoDescription,
  slug,
  altText,
  requireAlt = true,
}: {
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
  altText?: string | null;
  requireAlt?: boolean;
}) {
  const health = computeSeoHealth({ seoTitle, seoDescription, slug, altText }, requireAlt);

  return (
    <span className="inline-flex items-center gap-2 text-xs text-fg-muted" title={LABEL[health]}>
      <span className={cn("h-2.5 w-2.5 rounded-full", COLOR[health])} aria-hidden />
      {LABEL[health]}
    </span>
  );
}
