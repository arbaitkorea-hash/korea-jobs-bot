"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SeoFieldsPanel } from "@/components/admin/seo-fields";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import { computeSeoHealth } from "@/lib/seo-health";
import {
  saveBlogPost,
  type BlogPostFormInput,
  type BlogTranslationInput,
} from "@/app/(admin)/admin/(dashboard)/blog/actions";

export function BlogForm({ id, initial }: { id: string | null; initial: BlogPostFormInput }) {
  const [values, setValues] = useState(initial);
  const [activeLocale, setActiveLocale] = useState<AppLocale>("ru");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setTranslation(locale: AppLocale, patch: Partial<BlogTranslationInput>) {
    setValues((v) => ({
      ...v,
      translations: { ...v.translations, [locale]: { ...v.translations[locale], ...patch } },
    }));
  }

  const completeness = Object.fromEntries(
    LOCALES.map((l) => [
      l,
      computeSeoHealth(
        {
          title: values.translations[l].title,
          slug: values.translations[l].slug,
          seoTitle: values.translations[l].seoTitle,
          seoDescription: values.translations[l].seoDescription,
        },
        false,
      ),
    ]),
  ) as Record<AppLocale, "green" | "yellow" | "red">;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const result = await saveBlogPost(id, values);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  }

  const t = values.translations[activeLocale];
  const field = "mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <LocaleTabs active={activeLocale} onChange={setActiveLocale} completeness={completeness} />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded border border-border p-6">
            <h3 className="font-serif text-lg">Статья — {activeLocale.toUpperCase()}</h3>

            <div>
              <label className="block text-sm text-fg-muted">Заголовок</label>
              <input
                required
                value={t.title}
                onChange={(e) => setTranslation(activeLocale, { title: e.target.value })}
                className={field}
              />
            </div>

            <div>
              <label className="block text-sm text-fg-muted">Краткое описание</label>
              <textarea
                value={t.excerpt}
                onChange={(e) => setTranslation(activeLocale, { excerpt: e.target.value })}
                rows={2}
                className={field}
              />
            </div>

            <div>
              <label className="block text-sm text-fg-muted">Текст статьи</label>
              <div className="mt-1">
                {/* key нужен, чтобы редактор пересоздался при смене языка:
                    contentEditable наполняется один раз при монтировании. */}
                <RichTextEditor
                  key={activeLocale}
                  value={t.contentHtml}
                  onChange={(html) => setTranslation(activeLocale, { contentHtml: html })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded border border-border p-6">
            <h3 className="font-serif text-lg">Общее</h3>
            <div>
              <label className="block text-sm text-fg-muted">Обложка (URL)</label>
              <input
                value={values.coverImage}
                onChange={(e) => setValues((v) => ({ ...v, coverImage: e.target.value }))}
                className={`${field} font-mono text-sm`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.published}
                onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
              />
              Опубликовано
            </label>
          </section>

          {error && <p className="rounded border border-danger/40 p-3 text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>

        <SeoFieldsPanel
          locale={activeLocale}
          basePath="/blog"
          showAlt={false}
          showOg={false}
          values={t}
          onChange={(seo) =>
            setTranslation(activeLocale, {
              slug: seo.slug,
              seoTitle: seo.seoTitle,
              seoDescription: seo.seoDescription,
              keywords: seo.keywords,
              hashtags: seo.hashtags,
              canonicalUrl: seo.canonicalUrl,
            })
          }
        />
      </div>
    </form>
  );
}
