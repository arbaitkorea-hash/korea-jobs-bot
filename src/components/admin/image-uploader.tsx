"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { X } from "lucide-react";

export type UploadedImage = {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
};

export function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const next = [...images];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка загрузки файла.");
        continue;
      }
      next.push({ id: crypto.randomUUID(), url: data.url, thumbUrl: data.thumbUrl, width: data.width, height: data.height });
    }

    onChange(next);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {images.map((img, i) => (
          <div key={img.id} className="relative h-28 w-24 shrink-0 overflow-hidden rounded border border-border bg-bg-elevated">
            <Image src={img.thumbUrl} alt="" fill className="object-cover" sizes="96px" />
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Удалить изображение"
            >
              <X size={12} />
            </button>
            <div className="absolute bottom-1 left-1 right-1 flex justify-between text-[10px]">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded bg-black/60 px-1 text-white disabled:opacity-30">←</button>
              {i === 0 && <span className="rounded bg-black/60 px-1 text-white">Главное</span>}
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded bg-black/60 px-1 text-white disabled:opacity-30">→</button>
            </div>
          </div>
        ))}
      </div>

      <label className="mt-4 inline-block cursor-pointer rounded border border-dashed border-border px-4 py-2 text-sm text-fg-muted hover:border-fg hover:text-fg">
        {uploading ? "Загрузка…" : "Загрузить изображения"}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
