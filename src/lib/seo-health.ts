export type SeoHealth = "green" | "yellow" | "red";

type SeoFields = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
  altText?: string | null;
};

/** "Светофор" в списке админки: считает, сколько обязательных SEO-полей заполнено. */
export function computeSeoHealth(fields: SeoFields, requireAlt = true): SeoHealth {
  const checks = [
    Boolean(fields.seoTitle && fields.seoTitle.length > 0 && fields.seoTitle.length <= 70),
    Boolean(fields.seoDescription && fields.seoDescription.length > 0 && fields.seoDescription.length <= 160),
    Boolean(fields.slug && fields.slug.length > 0),
    !requireAlt || Boolean(fields.altText && fields.altText.length > 0),
  ];

  const passed = checks.filter(Boolean).length;
  if (passed === checks.length) return "green";
  if (passed >= checks.length - 1) return "yellow";
  return "red";
}
