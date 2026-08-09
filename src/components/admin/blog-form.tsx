"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SeoFieldsPanel } from "@/components/admin/seo-fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { saveBlogPost, type BlogPostFormInput } from "@/app/admin/(dashboard)/blog/actions";

export function BlogForm({ id, initial }: { id: string | null; initial: BlogPostFormInput }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="space-y-4 rounded border border-border p-6">
          <div>
            <label className="block text-sm text-fg-muted">Заголовок</label>
            <input
              required
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-fg-muted">Обложка (URL)</label>
            <input
              value={values.coverImage}
              onChange={(e) => setValues((v) => ({ ...v, coverImage: e.target.value }))}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-fg-muted">Краткое описание (excerpt)</label>
            <textarea
              value={values.excerpt}
              onChange={(e) => setValues((v) => ({ ...v, excerpt: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-fg-muted">Текст статьи</label>
            <div className="mt-1">
              <RichTextEditor
                value={values.contentHtml}
                onChange={(html) => setValues((v) => ({ ...v, contentHtml: html }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.published} onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))} />
            Опубликовано
          </label>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
      </div>

      <SeoFieldsPanel
        basePath="/blog"
        showAlt={false}
        values={values}
        onChange={(seo) => setValues((v) => ({ ...v, ...seo }))}
      />
    </form>
  );
}
