export type SeoHealth = "green" | "yellow" | "red";

export type SeoFields = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
  altText?: string | null;
  title?: string | null;
};

/**
 * «Светофор» заполненности SEO. Учитывает не только наличие, но и длину:
 * meta title длиннее 70 и description длиннее 160 символов Google обрезает,
 * поэтому переполнение — тоже недоработка, а не «зелёный».
 */
export function computeSeoHealth(fields: SeoFields, requireAlt = true): SeoHealth {
  const checks = [
    Boolean(fields.title && fields.title.trim()),
    Boolean(fields.slug && fields.slug.trim()),
    Boolean(
      fields.seoTitle && fields.seoTitle.trim().length > 0 && fields.seoTitle.length <= 70,
    ),
    Boolean(
      fields.seoDescription &&
        fields.seoDescription.trim().length > 0 &&
        fields.seoDescription.length <= 160,
    ),
    ...(requireAlt ? [Boolean(fields.altText && fields.altText.trim())] : []),
  ];

  const passed = checks.filter(Boolean).length;
  if (passed === checks.length) return "green";
  if (passed >= checks.length - 1) return "yellow";
  return "red";
}
