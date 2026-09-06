"use client";

import { siteConfig } from "@/lib/site-config";
import { TagInput } from "@/components/admin/tag-input";
import type { AppLocale } from "@/lib/i18n/config";

export type SeoValues = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  hashtags: string;
  canonicalUrl: string;
  altText?: string;
  ogTitle?: string;
  ogDescription?: string;
};

export function SeoFieldsPanel({
  locale,
  values,
  onChange,
  basePath,
  showAlt = true,
  showOg = true,
  onAutofill,
}: {
  locale: AppLocale;
  values: SeoValues;
  onChange: (values: SeoValues) => void;
  /** Раздел без языкового префикса, например "/gallery". */
  basePath: string;
  showAlt?: boolean;
  showOg?: boolean;
  /** Заполнить title/description/ключевые слова по данным работы. */
  onAutofill?: () => void;
}) {
  const url = `${siteConfig.url}/${locale}${basePath}/${values.slug || "…"}`;

  function set<K extends keyof SeoValues>(key: K, value: SeoValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const field = "mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2";
  const counter = (len: number, max: number) =>
    len > max ? "text-danger" : len === 0 ? "text-fg-muted" : "text-emerald-600";

  return (
    <div className="space-y-5 rounded border border-border p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg">SEO — {locale.toUpperCase()}</h3>
        {onAutofill && (
          <button
            type="button"
            onClick={onAutofill}
            className="text-sm underline underline-offset-4 hover:text-accent"
          >
            Собрать по работе
          </button>
        )}
      </div>
      {onAutofill && (
        <p className="-mt-3 text-xs text-fg-muted">
          Соберёт заголовок и описание по формуле «название + техника + размер + купить»
          и подставит первую фразу описания как зацепку для выдачи. Всё написанное
          вручную будет заменено.
        </p>
      )}

      <div>
        <label className="block text-sm text-fg-muted">Slug (URL)</label>
        <input
          value={values.slug}
          onChange={(e) =>
            set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, ""))
          }
          className={`${field} font-mono text-sm`}
        />
        <p className="mt-1 text-xs text-fg-muted">Только латиница — так требуют чистые ЧПУ-URL.</p>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-fg-muted">
          <span>Meta title</span>
          <span className={counter(values.seoTitle.length, 70)}>{values.seoTitle.length}/70</span>
        </label>
        <input
          value={values.seoTitle}
          onChange={(e) => set("seoTitle", e.target.value)}
          maxLength={120}
          className={field}
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-sm text-fg-muted">
          <span>Meta description</span>
          <span className={counter(values.seoDescription.length, 160)}>
            {values.seoDescription.length}/160
          </span>
        </label>
        <textarea
          value={values.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          maxLength={300}
          rows={3}
          className={field}
        />
      </div>

      {showAlt && (
        <div>
          <label className="block text-sm text-fg-muted">Alt-текст изображения</label>
          <input
            value={values.altText ?? ""}
            onChange={(e) => set("altText", e.target.value)}
            maxLength={200}
            className={field}
          />
          {!values.altText?.trim() && (
            <p className="mt-1 text-xs text-danger">
              Без alt-текста на этом языке публикация будет заблокирована.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm text-fg-muted">Ключевые слова</label>
        <TagInput
          value={values.keywords}
          onChange={(v) => set("keywords", v)}
          placeholder="картина маслом, пейзаж, закат…"
        />
      </div>

      <div>
        <label className="block text-sm text-fg-muted">Хэштеги для соцсетей</label>
        <TagInput
          value={values.hashtags}
          onChange={(v) => set("hashtags", v)}
          placeholder="oilpainting, seascape…"
          prefix="#"
        />
      </div>

      {showOg && (
        <>
          <div>
            <label className="block text-sm text-fg-muted">OG-заголовок (соцсети)</label>
            <input
              value={values.ogTitle ?? ""}
              onChange={(e) => set("ogTitle", e.target.value)}
              maxLength={70}
              placeholder={values.seoTitle}
              className={field}
            />
          </div>
          <div>
            <label className="block text-sm text-fg-muted">OG-описание (соцсети)</label>
            <textarea
              value={values.ogDescription ?? ""}
              onChange={(e) => set("ogDescription", e.target.value)}
              maxLength={200}
              rows={2}
              placeholder={values.seoDescription}
              className={field}
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm text-fg-muted">Канонический URL (необязательно)</label>
        <input
          value={values.canonicalUrl}
          onChange={(e) => set("canonicalUrl", e.target.value)}
          placeholder={`/${locale}${basePath}/${values.slug}`}
          className={`${field} font-mono text-sm`}
        />
      </div>

      <div className="rounded border border-border bg-bg-elevated p-4">
        <p className="text-xs text-fg-muted">Превью в Google</p>
        <p className="mt-2 line-clamp-1 text-sm text-[#1a0dab]">
          {values.seoTitle || "Заголовок страницы"}
        </p>
        <p className="truncate text-xs text-[#006621]">{url}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#545454]">
          {values.seoDescription || "Описание страницы появится здесь…"}
        </p>
      </div>
    </div>
  );
}
