"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { saveRates, type RateInput } from "@/app/(admin)/admin/(dashboard)/rates/actions";

const LABEL: Record<string, string> = {
  RUB: "рубль (₽)",
  KRW: "вона (₩)",
  USD: "доллар ($)",
};

export function RatesForm({ initial }: { initial: RateInput[] }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const result = await saveRates(rows);
    setSaving(false);
    if (result?.error) setError(result.error);
    else setSaved(true);
  }

  const field = "w-40 rounded border border-border bg-bg-elevated px-3 py-2";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-4 rounded border border-border p-6">
        {rows.map((row, index) => (
          <label key={`${row.base}>${row.quote}`} className="flex items-center gap-4">
            <span className="w-64 text-sm">
              1 {LABEL[row.base]} = <span className="text-fg-muted">? {LABEL[row.quote]}</span>
            </span>
            <input
              value={row.rate}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, i) => (i === index ? { ...r, rate: e.target.value } : r)),
                )
              }
              inputMode="decimal"
              placeholder="не пересчитывать"
              className={field}
            />
          </label>
        ))}
      </div>

      <p className="text-sm text-fg-muted">
        Пустое поле или ноль — цена в этой валюте не показывается: посетитель увидит
        исходную цену работы. Пересчитанные суммы выводятся со знаком «≈» и округляются,
        поэтому мелкие колебания курса менять здесь не нужно — достаточно раза в месяц.
      </p>

      {error && <p className="rounded border border-danger/40 p-3 text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">Курсы сохранены.</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>
    </form>
  );
}
