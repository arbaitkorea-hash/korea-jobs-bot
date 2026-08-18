"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function ImageZoom({
  src,
  alt,
  width,
  height,
  zoomLabel,
  closeLabel,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  zoomLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  // Esc закрывает просмотр — ожидаемое поведение для модального изображения.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in"
        aria-label={zoomLabel}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority
          className="h-auto w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={closeLabel}
            className="absolute right-6 top-6 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </>
  );
}
