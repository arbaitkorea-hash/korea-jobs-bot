"use client";

import Image from "next/image";
import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

/**
 * «Как это выглядит на стене» — картина в реальном масштабе.
 *
 * Главное возражение при покупке живописи в интернете не «дорого», а «я не
 * понимаю, какая она». «70×50 см» — абстракция; человек рядом и высота стены
 * превращают её в предмет, который можно представить у себя. Поэтому сцена
 * строится от сантиметров, а не от пикселей: рост фигуры 170 см и высота стены
 * 280 см заданы жёстко, и от них считается размер полотна.
 *
 * Почему не 3D-зал: тяжёлый бандл и мобильные телефоны ради впечатления,
 * которое работает один раз. Здесь та же польза достигается разметкой,
 * которая грузится мгновенно и одинаково работает на любом устройстве.
 */

const SCENE_HEIGHT_CM = 280;
/** Музейная норма: центр работы на высоте глаз — примерно 150 см от пола. */
const CENTER_HEIGHT_CM = 150;
const FIGURE_HEIGHT_CM = 170;

type WallTone = "warm" | "cool" | "dark";

const WALLS: Record<WallTone, { wall: string; floor: string; ink: string; shadow: string }> = {
  warm: { wall: "#EFE9E1", floor: "#D9CFC2", ink: "#5B544B", shadow: "rgba(60,48,36,0.28)" },
  cool: { wall: "#DFE3E5", floor: "#C6CCD0", ink: "#4A5157", shadow: "rgba(30,40,50,0.28)" },
  dark: { wall: "#2A2A2C", floor: "#1E1E20", ink: "#9A948C", shadow: "rgba(0,0,0,0.55)" },
};

export function WallPreview({
  src,
  alt,
  widthCm,
  heightCm,
  dict,
}: {
  src: string;
  alt: string;
  widthCm: number;
  heightCm: number;
  dict: Dictionary;
}) {
  const [tone, setTone] = useState<WallTone>("warm");
  const t = dict.artwork.wall;
  const palette = WALLS[tone];

  // Всё в процентах от высоты сцены — так масштаб не зависит от того, какой
  // ширины экран у посетителя, и остаётся честным на телефоне.
  const pct = (cm: number) => (cm / SCENE_HEIGHT_CM) * 100;
  const bottomCm = CENTER_HEIGHT_CM - heightCm / 2;

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-sm"
        style={{ aspectRatio: "3 / 2", background: palette.wall }}
      >
        {/* Свет сверху слева: ровная заливка выглядит как картонка, а не как
            стена. Градиент едва заметен, но именно он даёт ощущение комнаты. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 22% 0%, rgba(255,255,255,0.35), rgba(0,0,0,0.06) 70%)",
          }}
        />

        {/* Пол: он и даёт понять, что стена — стена, а не просто фон. */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: "12%", background: palette.floor }}
        />
        {/* Плинтус — тонкая линия, на которой держится вся иллюзия глубины. */}
        <div
          className="absolute inset-x-0"
          style={{ bottom: "12%", height: "1.4%", background: palette.ink, opacity: 0.18 }}
        />

        {/* Фигура для масштаба. Намеренно обобщённая и полупрозрачная: её
            задача — дать рост, а не соперничать с картиной за внимание. */}
        <svg
          viewBox="0 0 60 170"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
          className="absolute"
          style={{
            right: "16%",
            bottom: "12%",
            height: `${pct(FIGURE_HEIGHT_CM) * 0.88}%`,
            opacity: 0.2,
            color: palette.ink,
          }}
        >
          {/* Фигура собрана из простых форм намеренно: подробный силуэт
              притягивает взгляд и начинает спорить с работой за внимание. */}
          <circle cx="30" cy="13" r="11" fill="currentColor" />
          <rect x="15" y="27" width="30" height="70" rx="12" fill="currentColor" />
          <rect x="8" y="32" width="7" height="58" rx="3.5" fill="currentColor" />
          <rect x="45" y="32" width="7" height="58" rx="3.5" fill="currentColor" />
          <rect x="19" y="92" width="9" height="78" rx="4.5" fill="currentColor" />
          <rect x="32" y="92" width="9" height="78" rx="4.5" fill="currentColor" />
        </svg>

        {/* Сама работа: тень мягкая и смещена вниз — так вешают под верхним
            светом, и именно эта тень читается как «предмет на стене». */}
        <div
          className="absolute"
          style={{
            left: "40%",
            bottom: `${12 + pct(bottomCm) * 0.88}%`,
            height: `${pct(heightCm) * 0.88}%`,
            aspectRatio: `${widthCm} / ${heightCm}`,
            transform: "translateX(-50%)",
            boxShadow: `0 ${Math.max(6, heightCm / 6)}px ${Math.max(14, heightCm / 3)}px ${palette.shadow}`,
          }}
        >
          <Image src={src} alt={alt} fill className="object-cover" sizes="40vw" />
        </div>

        <p
          className="absolute left-4 top-4 text-xs tracking-wide"
          style={{ color: palette.ink }}
        >
          {widthCm}×{heightCm} {dict.artwork.cm} · {t.scaleNote}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-fg-muted">{t.wallColor}</span>
        {(Object.keys(WALLS) as WallTone[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTone(key)}
            aria-pressed={tone === key}
            className={cn(
              "h-6 w-6 rounded-full border transition-transform",
              tone === key ? "scale-110 border-fg" : "border-border hover:scale-105",
            )}
            style={{ background: WALLS[key].wall }}
            title={t[key]}
            aria-label={t[key]}
          />
        ))}
      </div>
    </div>
  );
}
