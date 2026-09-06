"use client";

import { useState } from "react";
import { ImageZoom } from "@/components/artwork/image-zoom";
import { WallPreview } from "@/components/artwork/wall-preview";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/**
 * Два взгляда на работу: фотография и та же работа на стене в масштабе.
 *
 * Фотография открыта по умолчанию — её видит и поисковик, и посетитель без
 * JavaScript. «На стене» — второй шаг, к которому человек приходит, когда
 * работа уже понравилась и остаётся вопрос «а как она будет у меня».
 */
export function ArtworkViewer({
  src,
  alt,
  width,
  height,
  widthCm,
  heightCm,
  dict,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  widthCm: number;
  heightCm: number;
  dict: Dictionary;
}) {
  const [view, setView] = useState<"photo" | "wall">("photo");
  const t = dict.artwork.wall;

  const tab = "px-4 py-1.5 text-sm transition-colors rounded-full";

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-border p-1">
        <button
          type="button"
          onClick={() => setView("photo")}
          aria-pressed={view === "photo"}
          className={cn(tab, view === "photo" ? "bg-fg text-bg" : "text-fg-muted hover:text-fg")}
        >
          {t.viewPhoto}
        </button>
        <button
          type="button"
          onClick={() => setView("wall")}
          aria-pressed={view === "wall"}
          className={cn(tab, view === "wall" ? "bg-fg text-bg" : "text-fg-muted hover:text-fg")}
        >
          {t.viewWall}
        </button>
      </div>

      {view === "photo" ? (
        <div className="shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
          <ImageZoom
            src={src}
            alt={alt}
            width={width}
            height={height}
            zoomLabel={dict.common.zoomImage}
            closeLabel={dict.common.close}
          />
        </div>
      ) : (
        <WallPreview src={src} alt={alt} widthCm={widthCm} heightCm={heightCm} dict={dict} />
      )}
    </div>
  );
}
