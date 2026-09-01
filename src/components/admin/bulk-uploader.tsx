"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type DragEvent } from "react";
import { Check, Loader2, Trash2, TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import {
  createArtworksBulk,
  type BulkArtworkRow,
} from "@/app/(admin)/admin/(dashboard)/artworks/bulk-actions";

type Row = {
  id: string;
  fileName: string;
  status: "uploading" | "ready" | "failed";
  error?: string;
  thumbUrl?: string;
  image?: { url: string; width: number; height: number };
  dominantColor: string;
  title: string;
  widthCm: string;
  heightCm: string;
  price: string;
  technique: "OIL" | "ACRYLIC" | "MIXED";
  year: string;
  collectionId: string;
};

const MAX_ROWS = 60;

export function BulkUploader({ collections }: { collections: { id: string; title: string }[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Значения, которые обычно одинаковы для всей партии — задаются один раз сверху
  // и применяются к новым строкам. Это и есть основная экономия кликов.
  const [defaults, setDefaults] = useState({
    technique: "OIL" as Row["technique"],
    year: String(new Date().getFullYear()),
    collectionId: "",
    price: "",
  });

  const update = useCallback((id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError("");
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;

      const free = MAX_ROWS - rows.length;
      if (free <= 0) {
        setError(`За один раз можно загрузить не больше ${MAX_ROWS} работ.`);
        return;
      }
      const batch = images.slice(0, free);
      if (images.length > free) {
        setError(`Добавлены первые ${free} файлов — это предел за один заход.`);
      }

      const pending: Row[] = batch.map((file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        status: "uploading",
        dominantColor: "",
        // Имя файла как черновик названия: «Закат над озером.jpg» → «Закат над озером».
        title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
        widthCm: "",
        heightCm: "",
        price: defaults.price,
        technique: defaults.technique,
        year: defaults.year,
        collectionId: defaults.collectionId,
      }));

      setRows((prev) => [...prev, ...pending]);

      // Последовательно, а не параллельно: сервер конвертирует каждый файл через
      // sharp, и десяток одновременных конвертаций съест память инстанса.
      for (const [i, file] of batch.entries()) {
        const row = pending[i];
        const form = new FormData();
        form.append("file", file);
        try {
          const res = await fetch("/api/admin/upload", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) {
            update(row.id, { status: "failed", error: data.error ?? "Ошибка загрузки" });
            continue;
          }
          update(row.id, {
            status: "ready",
            thumbUrl: data.thumbUrl,
            image: { url: data.url, width: data.width, height: data.height },
            dominantColor: data.dominantColor ?? "",
          });
        } catch {
          update(row.id, { status: "failed", error: "Сеть недоступна" });
        }
      }
    },
    [rows.length, defaults, update],
  );

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }

  /** Проставляет значения «по умолчанию» во все строки, где поле ещё пустое. */
  function applyDefaults() {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        technique: defaults.technique,
        year: r.year || defaults.year,
        price: r.price || defaults.price,
        collectionId: r.collectionId || defaults.collectionId,
      })),
    );
  }

  const ready = rows.filter((r) => r.status === "ready");
  const incomplete = ready.filter(
    (r) => !r.title.trim() || !Number(r.widthCm) || !Number(r.heightCm) || r.price === "",
  );
  const canSave = ready.length > 0 && incomplete.length === 0 && !saving;

  async function handleSave() {
    setSaving(true);
    setError("");

    const payload: BulkArtworkRow[] = ready.map((r) => ({
      title: r.title.trim(),
      widthCm: Number(r.widthCm),
      heightCm: Number(r.heightCm),
      priceOriginalCents: Math.round(Number(r.price) * 100),
      technique: r.technique,
      year: r.year ? Number(r.year) : null,
      collectionId: r.collectionId || null,
      dominantColor: r.dominantColor,
      image: r.image!,
    }));

    const result = await createArtworksBulk(payload);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    router.push("/admin/artworks");
    router.refresh();
  }

  // Без w-full: у полей строки есть свои ширины (w-24, w-32), а Tailwind
  // разрешает конфликт по порядку в CSS, а не по порядку в className —
  // с w-full в базовом классе размеры и цена растягивались на всю строку.
  const field = "rounded border border-border bg-bg-elevated px-2 py-1.5 text-sm";

  return (
    <div className="space-y-8">
      {/* Зона перетаскивания */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors",
          dragOver ? "border-fg bg-bg-elevated" : "border-border hover:border-fg/50",
        )}
      >
        <Upload size={28} className="text-fg-muted" />
        <p className="mt-4 font-serif text-xl">Перетащите фотографии работ сюда</p>
        <p className="mt-2 text-sm text-fg-muted">
          Можно выбрать сразу много файлов — до {MAX_ROWS} за один раз. JPEG, PNG, WebP.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {rows.length > 0 && (
        <>
          {/* Общие значения для партии */}
          <section className="rounded border border-border p-5">
            <h2 className="font-serif text-lg">Общее для всей партии</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Задайте один раз и примените ко всем строкам — вручную останется
              вписать только название и размеры.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-fg-muted">Техника</span>
                <select
                  value={defaults.technique}
                  onChange={(e) =>
                    setDefaults((d) => ({ ...d, technique: e.target.value as Row["technique"] }))
                  }
                  className={`${field} w-36`}
                >
                  <option value="OIL">Масло</option>
                  <option value="ACRYLIC">Акрил</option>
                  <option value="MIXED">Смешанная</option>
                </select>
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-fg-muted">Год</span>
                <input
                  value={defaults.year}
                  onChange={(e) => setDefaults((d) => ({ ...d, year: e.target.value }))}
                  className={`${field} w-24`}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-fg-muted">Цена, ₩</span>
                <input
                  value={defaults.price}
                  onChange={(e) => setDefaults((d) => ({ ...d, price: e.target.value }))}
                  placeholder="850000"
                  className={`${field} w-32`}
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-fg-muted">Коллекция</span>
                <select
                  value={defaults.collectionId}
                  onChange={(e) => setDefaults((d) => ({ ...d, collectionId: e.target.value }))}
                  className={`${field} w-44`}
                >
                  <option value="">Без коллекции</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" variant="secondary" onClick={applyDefaults}>
                Применить ко всем
              </Button>
            </div>
          </section>

          {/* Строки */}
          <ul className="space-y-3">
            {rows.map((row, index) => {
              const missing =
                row.status === "ready" &&
                (!row.title.trim() || !Number(row.widthCm) || !Number(row.heightCm) || row.price === "");

              return (
                <li
                  key={row.id}
                  className={cn(
                    "flex flex-wrap items-start gap-4 rounded border p-3",
                    row.status === "failed"
                      ? "border-danger/50"
                      : missing
                        ? "border-amber-500/50"
                        : "border-border",
                  )}
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded bg-bg-elevated">
                    {row.thumbUrl ? (
                      <Image src={row.thumbUrl} alt="" fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {row.status === "uploading" ? (
                          <Loader2 size={16} className="animate-spin text-fg-muted" />
                        ) : (
                          <TriangleAlert size={16} className="text-danger" />
                        )}
                      </div>
                    )}
                    {row.dominantColor && (
                      <span
                        title={`Определён цвет ${row.dominantColor}`}
                        className="absolute bottom-1 right-1 h-4 w-4 rounded-full border border-white/70"
                        style={{ background: row.dominantColor }}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-fg-muted">{index + 1}.</span>
                      <span className="truncate text-xs text-fg-muted">{row.fileName}</span>
                      {row.status === "ready" && !missing && (
                        <Check size={13} className="shrink-0 text-emerald-600" />
                      )}
                    </div>

                    {row.status === "failed" ? (
                      <p className="text-sm text-danger">{row.error}</p>
                    ) : (
                      <>
                        <input
                          value={row.title}
                          onChange={(e) => update(row.id, { title: e.target.value })}
                          placeholder="Название работы (по-русски)"
                          className={`${field} w-full`}
                        />
                        <div className="flex flex-wrap gap-2">
                          <input
                            value={row.widthCm}
                            onChange={(e) => update(row.id, { widthCm: e.target.value })}
                            placeholder="Ширина"
                            inputMode="decimal"
                            className={`${field} w-24`}
                          />
                          <input
                            value={row.heightCm}
                            onChange={(e) => update(row.id, { heightCm: e.target.value })}
                            placeholder="Высота"
                            inputMode="decimal"
                            className={`${field} w-24`}
                          />
                          <input
                            value={row.price}
                            onChange={(e) => update(row.id, { price: e.target.value })}
                            placeholder="Цена ₩"
                            inputMode="numeric"
                            className={`${field} w-32`}
                          />
                          <select
                            value={row.technique}
                            onChange={(e) =>
                              update(row.id, { technique: e.target.value as Row["technique"] })
                            }
                            className={`${field} w-36`}
                          >
                            <option value="OIL">Масло</option>
                            <option value="ACRYLIC">Акрил</option>
                            <option value="MIXED">Смешанная</option>
                          </select>
                        </div>
                        {row.title.trim() && (
                          <p className="truncate font-mono text-xs text-fg-muted">
                            /gallery/{slugify(row.title)}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                    aria-label="Убрать из списка"
                    className="text-fg-muted hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Итог */}
          <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-border bg-bg/95 py-4 backdrop-blur-sm">
            <Button type="button" onClick={handleSave} disabled={!canSave}>
              {saving ? "Сохранение…" : `Создать работ: ${ready.length}`}
            </Button>

            {incomplete.length > 0 && (
              <p className="text-sm text-amber-700">
                Заполните название, размеры и цену — осталось строк: {incomplete.length}
              </p>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}

            <p className="ml-auto max-w-md text-xs text-fg-muted">
              Работы создаются черновиками на русском. Переводы и SEO — во вкладках
              EN/KO в карточке; публикация откроется, когда будет alt-текст на трёх языках.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
