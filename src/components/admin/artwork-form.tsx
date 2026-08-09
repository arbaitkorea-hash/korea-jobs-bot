"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SeoFieldsPanel } from "@/components/admin/seo-fields";
import { ImageUploader, type UploadedImage } from "@/components/admin/image-uploader";
import { saveArtwork, type ArtworkFormInput } from "@/app/admin/(dashboard)/artworks/actions";

type Collection = { id: string; title: string };

export function ArtworkForm({
  artworkId,
  collections,
  initial,
}: {
  artworkId: string | null;
  collections: Collection[];
  initial: ArtworkFormInput;
}) {
  const [values, setValues] = useState<ArtworkFormInput>(initial);
  const [images, setImages] = useState<UploadedImage[]>(initial.images);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ArtworkFormInput>(key: K, value: ArtworkFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const result = await saveArtwork(artworkId, { ...values, images });
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="space-y-4 rounded border border-border p-6">
          <h3 className="font-serif text-lg">Основное</h3>

          <div>
            <label className="block text-sm text-fg-muted">Название</label>
            <input
              required
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-fg-muted">Ширина, см</label>
              <input
                type="number"
                required
                value={values.widthCm || ""}
                onChange={(e) => set("widthCm", Number(e.target.value))}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted">Высота, см</label>
              <input
                type="number"
                required
                value={values.heightCm || ""}
                onChange={(e) => set("heightCm", Number(e.target.value))}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-fg-muted">Год</label>
              <input
                type="number"
                value={values.year ?? ""}
                onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted">Техника</label>
              <input
                value={values.medium}
                onChange={(e) => set("medium", e.target.value)}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-fg-muted">Ориентация</label>
            <select
              value={values.orientation}
              onChange={(e) => set("orientation", e.target.value as ArtworkFormInput["orientation"])}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            >
              <option value="LANDSCAPE">Горизонтальная</option>
              <option value="PORTRAIT">Вертикальная</option>
              <option value="SQUARE">Квадрат</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-fg-muted">Краткое описание</label>
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-fg-muted">История / легенда картины</label>
            <textarea
              value={values.story}
              onChange={(e) => set("story", e.target.value)}
              rows={5}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>
        </section>

        <section className="space-y-4 rounded border border-border p-6">
          <h3 className="font-serif text-lg">Изображения</h3>
          <ImageUploader images={images} onChange={setImages} />
        </section>

        <section className="space-y-4 rounded border border-border p-6">
          <h3 className="font-serif text-lg">Цена и статус</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-fg-muted">Цена оригинала (в мелкой единице, ×100)</label>
              <input
                type="number"
                required
                value={values.priceOriginalCents || ""}
                onChange={(e) => set("priceOriginalCents", Number(e.target.value))}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted">Цена принта (опционально)</label>
              <input
                type="number"
                value={values.pricePrintCents ?? ""}
                onChange={(e) => set("pricePrintCents", e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-fg-muted">Валюта</label>
              <input
                value={values.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
                maxLength={3}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted">Статус</label>
              <select
                value={values.status}
                onChange={(e) => set("status", e.target.value as ArtworkFormInput["status"])}
                className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
              >
                <option value="AVAILABLE">В наличии</option>
                <option value="RESERVED">Резерв</option>
                <option value="SOLD">Продано</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-fg-muted">Коллекция</label>
            <select
              value={values.collectionId ?? ""}
              onChange={(e) => set("collectionId", e.target.value || null)}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            >
              <option value="">Без коллекции</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
            Показывать на главной
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={values.published} onChange={(e) => set("published", e.target.checked)} />
            Опубликовано
          </label>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>

      <SeoFieldsPanel
        basePath="/gallery"
        values={{
          slug: values.slug,
          seoTitle: values.seoTitle,
          seoDescription: values.seoDescription,
          altText: values.altText,
          ogImage: values.ogImage,
          canonicalUrl: values.canonicalUrl,
        }}
        onChange={(seo) =>
          setValues((v) => ({
            ...v,
            slug: seo.slug,
            seoTitle: seo.seoTitle,
            seoDescription: seo.seoDescription,
            altText: seo.altText ?? "",
            ogImage: seo.ogImage,
            canonicalUrl: seo.canonicalUrl,
          }))
        }
      />
    </form>
  );
}
