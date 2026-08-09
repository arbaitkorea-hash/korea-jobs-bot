"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";

export function ImageZoom({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in"
        aria-label="Увеличить изображение"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority
          className="h-auto w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
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
