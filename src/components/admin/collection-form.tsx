"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SeoFieldsPanel } from "@/components/admin/seo-fields";
import { saveCollection, type CollectionFormInput } from "@/app/admin/(dashboard)/collections/actions";

export function CollectionForm({ id, initial }: { id: string | null; initial: CollectionFormInput }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const result = await saveCollection(id, values);
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
            <label className="block text-sm text-fg-muted">Название</label>
            <input
              required
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-fg-muted">Описание</label>
            <textarea
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded border border-border bg-bg-elevated px-3 py-2"
            />
          </div>
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</Button>
      </div>

      <SeoFieldsPanel
        basePath="/collections"
        showAlt={false}
        values={values}
        onChange={(seo) => setValues((v) => ({ ...v, ...seo }))}
      />
    </form>
  );
}
