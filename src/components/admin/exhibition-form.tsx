"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { ImageUploader, type UploadedImage } from "@/components/admin/image-uploader";
import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import {
  saveExhibition,
  type ExhibitionFormInput,
  type ExhibitionTranslationInput,
} from "@/app/(admin)/admin/(dashboard)/exhibitions/actions";

export function ExhibitionForm({ id, initial }: { id: string | null; initial: ExhibitionFormInput }) {
  const [values, setValues] = useState(initial);
  const [activeLocale, setActiveLocale] = useState<AppLocale>("ru");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function setTranslation(locale: AppLocale, patch: Partial<ExhibitionTranslationInput>) {
    setValues((v) => ({
      ...v,
      translations: { ...v.translations, [locale]: { ...v.translations[locale], ...patch } },
    }));
  }

  // У выставки нет SEO-полей, поэтому индикатор проще: есть название и место —
  // зелёный, есть только название — жёлтый, пусто — красный.
  const completeness = Object.fromEntries(
    LOCALES.map((l) => {
      const t = values.translations[l];
      const state = !t.title.trim() ? "red" : t.location.trim() && t.description.trim() ? "green" : "yellow";
      return [l, state];
    }),
  ) as Record<AppLocale, "green" | "yellow" | "red">;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const result = await saveExhibition(id, values);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  }

  const t = values.translations[activeLocale];
  const field = "mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2";

  // Обложка хранится одной строкой, но грузим её тем же загрузчиком, что и
  // работы, — чтобы не заводить второй путь загрузки файлов с своей валидацией.
  const cover: UploadedImage[] = values.imageUrl
    ? [{ id: "cover", url: values.imageUrl, thumbUrl: values.imageUrl, width: 1200, height: 900 }]
    : [];

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <LocaleTabs active={activeLocale} onChange={setActiveLocale} completeness={completeness} />

      <section className="space-y-4 rounded border border-border p-6">
        <h3 className="font-serif text-lg">Тексты — {activeLocale.toUpperCase()}</h3>

        <div>
          <label className="block text-sm text-fg-muted">Название выставки</label>
          <input
            value={t.title}
            onChange={(e) => setTranslation(activeLocale, { title: e.target.value })}
            placeholder={activeLocale === "ru" ? "Персональная выставка «Свет Кореи»" : ""}
            className={field}
          />
        </div>

        <div>
          <label className="block text-sm text-fg-muted">Место проведения</label>
          <input
            value={t.location}
            onChange={(e) => setTranslation(activeLocale, { location: e.target.value })}
            placeholder={activeLocale === "ru" ? "Галерея Insa, Сеул" : ""}
            className={field}
          />
        </div>

        <div>
          <label className="block text-sm text-fg-muted">Описание</label>
          <textarea
            value={t.description}
            onChange={(e) => setTranslation(activeLocale, { description: e.target.value })}
            rows={5}
            className={field}
          />
        </div>

        {activeLocale !== "ru" && !t.title.trim() && (
          <p className="text-xs text-fg-muted">
            Пока перевода нет, выставка не появится в {activeLocale.toUpperCase()}-версии сайта.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded border border-border p-6">
        <h3 className="font-serif text-lg">Даты и ссылки</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-fg-muted">Начало</label>
            <input
              type="date"
              required
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
              className={field}
            />
          </div>
          <div>
            <label className="block text-sm text-fg-muted">Окончание (можно оставить пустым)</label>
            <input
              type="date"
              value={values.endDate}
              onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
              className={field}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-fg-muted">Ссылка на публикацию в прессе</label>
          <input
            type="url"
            value={values.pressUrl}
            onChange={(e) => setValues((v) => ({ ...v, pressUrl: e.target.value }))}
            placeholder="https://"
            className={`${field} font-mono text-sm`}
          />
        </div>

        <div>
          <label className="block text-sm text-fg-muted">Обложка</label>
          {values.imageUrl ? (
            <div className="mt-2 flex items-center gap-4">
              <div className="relative h-24 w-32 overflow-hidden rounded bg-bg-elevated">
                <Image src={values.imageUrl} alt="" fill className="object-cover" sizes="128px" />
              </div>
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, imageUrl: "" }))}
                className="text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
              >
                Удалить обложку
              </button>
            </div>
          ) : (
            <ImageUploader
              images={cover}
              onChange={(imgs) => setValues((v) => ({ ...v, imageUrl: imgs[0]?.url ?? "" }))}
            />
          )}
        </div>
      </section>

      {error && <p className="rounded border border-danger/40 p-3 text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
