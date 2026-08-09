"use client";

import { siteConfig } from "@/lib/site-config";

export type SeoValues = {
  seoTitle: string;
  seoDescription: string;
  slug: string;
  altText?: string;
  ogImage: string;
  canonicalUrl: string;
};

export function SeoFieldsPanel({
  values,
  onChange,
  basePath,
  showAlt = true,
}: {
  values: SeoValues;
  onChange: (values: SeoValues) => void;
  basePath: string;
  showAlt?: boolean;
}) {
  const url = `${siteConfig.url}${basePath}/${values.slug || "…"}`;

  function set<K extends keyof SeoValues>(key: K, value: SeoValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-5 rounded border border-border p-6">
      <h3 className="font-serif text-lg">SEO</h3>

      <div>
        <label className="flex items-center justify-between text-sm text-fg-muted">
          <span>Slug (URL)</span>
        </label>
        <input
          value={values.slug}
          onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-fg-muted">
          <span>Meta title</span>
          <span className={values.seoTitle.length > 70 ? "text-danger" : ""}>{values.seoTitle.length}/70</span>
        </label>
        <input
          value={values.seoTitle}
          onChange={(e) => set("seoTitle", e.target.value)}
          maxLength={100}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-fg-muted">
          <span>Meta description</span>
          <span className={values.seoDescription.length > 160 ? "text-danger" : ""}>
            {values.seoDescription.length}/160
          </span>
        </label>
        <textarea
          value={values.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          maxLength={300}
          rows={3}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
        />
      </div>

      {showAlt && (
        <div>
          <label className="block text-sm text-fg-muted">Alt-текст изображения</label>
          <input
            value={values.altText ?? ""}
            onChange={(e) => set("altText", e.target.value)}
            maxLength={200}
            className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
          />
          {!values.altText && (
            <p className="mt-1 text-xs text-danger">Без alt-текста публикация запрещена.</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm text-fg-muted">OG-изображение (URL)</label>
        <input
          value={values.ogImage}
          onChange={(e) => set("ogImage", e.target.value)}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-fg-muted">Канонический URL (опционально)</label>
        <input
          value={values.canonicalUrl}
          onChange={(e) => set("canonicalUrl", e.target.value)}
          placeholder={`${basePath}/${values.slug}`}
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2 font-mono text-sm"
        />
      </div>

      <div className="rounded border border-border bg-bg-elevated p-4">
        <p className="text-xs text-fg-muted">Превью в Google</p>
        <p className="mt-2 truncate text-sm text-[#1a0dab]">{values.seoTitle || "Заголовок страницы"}</p>
        <p className="text-xs text-[#006621]">{url}</p>
        <p className="mt-1 text-sm text-[#545454]">
          {values.seoDescription || "Описание страницы появится здесь…"}
        </p>
      </div>
    </div>
  );
}
