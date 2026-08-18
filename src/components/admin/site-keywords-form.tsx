"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/admin/tag-input";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { LOCALES, type AppLocale } from "@/lib/i18n/config";
import { parseTags } from "@/lib/utils";
import {
  saveSiteKeywords,
  type SiteKeywordsInput,
} from "@/app/(admin)/admin/(dashboard)/keywords/actions";

export function SiteKeywordsForm({ initial }: { initial: SiteKeywordsInput }) {
  const [values, setValues] = useState(initial);
  const [activeLocale, setActiveLocale] = useState<AppLocale>("ru");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const completeness = Object.fromEntries(
    LOCALES.map((l) => {
      const kw = parseTags(values[l].keywords).length;
      const ht = parseTags(values[l].hashtags).length;
      return [l, kw >= 5 && ht >= 5 ? "green" : kw > 0 || ht > 0 ? "yellow" : "red"];
    }),
  ) as Record<AppLocale, "green" | "yellow" | "red">;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    const result = await saveSiteKeywords(values);
    if (result?.error) {
      setError(result.error);
      setStatus("idle");
      return;
    }
    setStatus("saved");
  }

  const current = values[activeLocale];

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <LocaleTabs active={activeLocale} onChange={setActiveLocale} completeness={completeness} />

      <section className="space-y-6 rounded border border-border p-6">
        <div>
          <label className="block text-sm text-fg-muted">
            Ключевые слова сайта — {activeLocale.toUpperCase()}
          </label>
          <p className="mt-1 text-xs text-fg-muted">
            Общее семантическое ядро. Готовые списки под каждый язык — в SEO.md.
          </p>
          <TagInput
            value={current.keywords}
            onChange={(v) =>
              setValues((s) => ({ ...s, [activeLocale]: { ...s[activeLocale], keywords: v } }))
            }
            placeholder="картины маслом купить…"
          />
          <p className="mt-1 text-xs text-fg-muted">
            {parseTags(current.keywords).length} слов
          </p>
        </div>

        <div>
          <label className="block text-sm text-fg-muted">
            Хэштеги для соцсетей — {activeLocale.toUpperCase()}
          </label>
          <TagInput
            value={current.hashtags}
            onChange={(v) =>
              setValues((s) => ({ ...s, [activeLocale]: { ...s[activeLocale], hashtags: v } }))
            }
            placeholder="oilpainting…"
            prefix="#"
          />
          <p className="mt-1 text-xs text-fg-muted">
            {parseTags(current.hashtags).length} хэштегов
          </p>
        </div>

        {parseTags(current.hashtags).length > 0 && (
          <div className="rounded border border-border bg-bg-elevated p-4">
            <p className="text-xs text-fg-muted">Готово к копированию в пост:</p>
            <p className="mt-2 select-all break-words text-sm">
              {parseTags(current.hashtags)
                .map((t) => `#${t}`)
                .join(" ")}
            </p>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Сохранение…" : "Сохранить"}
        </Button>
        {status === "saved" && <span className="text-sm text-fg-muted">Сохранено ✓</span>}
      </div>
    </form>
  );
}
