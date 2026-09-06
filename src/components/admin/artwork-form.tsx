"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SeoFieldsPanel } from "@/components/admin/seo-fields";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { ImageUploader, type UploadedImage } from "@/components/admin/image-uploader";
import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import { computeSeoHealth } from "@/lib/seo-health";
import { buildArtworkSeo } from "@/lib/seo-copy";
import {
  saveArtwork,
  type ArtworkFormInput,
  type ArtworkTranslationInput,
} from "@/app/(admin)/admin/(dashboard)/artworks/actions";

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
  const [activeLocale, setActiveLocale] = useState<AppLocale>("ru");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ArtworkFormInput>(key: K, value: ArtworkFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setTranslation(locale: AppLocale, patch: Partial<ArtworkTranslationInput>) {
    setValues((v) => ({
      ...v,
      translations: { ...v.translations, [locale]: { ...v.translations[locale], ...patch } },
    }));
  }

  const completeness = Object.fromEntries(
    LOCALES.map((l) => [
      l,
      computeSeoHealth({
        title: values.translations[l].title,
        slug: values.translations[l].slug,
        seoTitle: values.translations[l].seoTitle,
        seoDescription: values.translations[l].seoDescription,
        altText: values.translations[l].altText,
      }),
    ]),
  ) as Record<AppLocale, "green" | "yellow" | "red">;

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

  const t = values.translations[activeLocale];
  const field = "mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <LocaleTabs active={activeLocale} onChange={setActiveLocale} completeness={completeness} />

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Тексты — свои на каждом языке */}
          <section className="space-y-4 rounded border border-border p-6">
            <h3 className="font-serif text-lg">Тексты — {activeLocale.toUpperCase()}</h3>

            <div>
              <label className="block text-sm text-fg-muted">Название</label>
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
                value={t.description}
                onChange={(e) => setTranslation(activeLocale, { description: e.target.value })}
                rows={3}
                className={field}
              />
            </div>

            <div>
              <label className="block text-sm text-fg-muted">История / легенда работы</label>
              <textarea
                value={t.story}
                onChange={(e) => setTranslation(activeLocale, { story: e.target.value })}
                rows={5}
                className={field}
              />
            </div>
          </section>

          {/* Общие для всех языков характеристики */}
          <section className="space-y-4 rounded border border-border p-6">
            <h3 className="font-serif text-lg">Характеристики (общие для всех языков)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-fg-muted">Ширина, см</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={values.widthCm || ""}
                  onChange={(e) => set("widthCm", Number(e.target.value))}
                  className={field}
                />
              </div>
              <div>
                <label className="block text-sm text-fg-muted">Высота, см</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={values.heightCm || ""}
                  onChange={(e) => set("heightCm", Number(e.target.value))}
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-fg-muted">Техника</label>
                <select
                  value={values.technique}
                  onChange={(e) => set("technique", e.target.value as ArtworkFormInput["technique"])}
                  className={field}
                >
                  <option value="OIL">Масло</option>
                  <option value="ACRYLIC">Акрил</option>
                  <option value="MIXED">Смешанная</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-fg-muted">Год</label>
                <input
                  type="number"
                  value={values.year ?? ""}
                  onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)}
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-fg-muted">Ориентация</label>
                <select
                  value={values.orientation}
                  onChange={(e) =>
                    set("orientation", e.target.value as ArtworkFormInput["orientation"])
                  }
                  className={field}
                >
                  <option value="LANDSCAPE">Горизонтальная</option>
                  <option value="PORTRAIT">Вертикальная</option>
                  <option value="SQUARE">Квадрат</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-fg-muted">Основной цвет (HEX)</label>
                <input
                  value={values.dominantColor}
                  onChange={(e) => set("dominantColor", e.target.value)}
                  placeholder="#B5652F"
                  className={`${field} font-mono text-sm`}
                />
              </div>
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
                <label className="block text-sm text-fg-muted">
                  Цена оригинала (в минорных единицах, ×100)
                </label>
                <input
                  type="number"
                  required
                  value={values.priceOriginalCents || ""}
                  onChange={(e) => set("priceOriginalCents", Number(e.target.value))}
                  className={field}
                />
              </div>
              <div>
                <label className="block text-sm text-fg-muted">Цена принта (необязательно)</label>
                <input
                  type="number"
                  value={values.pricePrintCents ?? ""}
                  onChange={(e) =>
                    set("pricePrintCents", e.target.value ? Number(e.target.value) : null)
                  }
                  className={field}
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
                  className={field}
                />
              </div>
              <div>
                <label className="block text-sm text-fg-muted">Статус</label>
                <select
                  value={values.status}
                  onChange={(e) => set("status", e.target.value as ArtworkFormInput["status"])}
                  className={field}
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
                className={field}
              >
                <option value="">Без коллекции</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Показывать на главной
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.published}
                onChange={(e) => set("published", e.target.checked)}
              />
              Опубликовано (нужен alt-текст на всех трёх языках)
            </label>
          </section>

          {error && <p className="rounded border border-danger/40 p-3 text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>

        <SeoFieldsPanel
          locale={activeLocale}
          basePath="/gallery"
          onAutofill={() =>
            setTranslation(
              activeLocale,
              buildArtworkSeo(activeLocale, {
                title: values.translations[activeLocale].title,
                description: values.translations[activeLocale].description,
                technique: values.technique,
                widthCm: values.widthCm,
                heightCm: values.heightCm,
                year: values.year,
                status: values.status,
              }),
            )
          }
          values={{
            slug: t.slug,
            seoTitle: t.seoTitle,
            seoDescription: t.seoDescription,
            altText: t.altText,
            ogTitle: t.ogTitle,
            ogDescription: t.ogDescription,
            keywords: t.keywords,
            hashtags: t.hashtags,
            canonicalUrl: t.canonicalUrl,
          }}
          onChange={(seo) =>
            setTranslation(activeLocale, {
              slug: seo.slug,
              seoTitle: seo.seoTitle,
              seoDescription: seo.seoDescription,
              altText: seo.altText ?? "",
              ogTitle: seo.ogTitle ?? "",
              ogDescription: seo.ogDescription ?? "",
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
