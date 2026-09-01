import type { ColorFamily } from "@prisma/client";

/**
 * Преобладающий цвет → цветовая «семья» для фильтра в галерее.
 *
 * Считаем через HSL, а не по близости к эталонным RGB: у живописи цвета
 * приглушённые, и «пыльный синий» по расстоянию в RGB окажется ближе к серому,
 * чем к синему. Оттенок (hue) при этом остаётся синим, поэтому разделяем
 * сначала по насыщенности, и только для насыщенных смотрим на оттенок.
 */
export function colorFamilyOf(hex: string): ColorFamily | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;

  // Почти без цвета — серое, белое, чёрное.
  if (delta < 0.09) return "NEUTRAL";

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  // Приглушённые тёмные тона — земляная гамма, а не «красный» или «зелёный».
  if (saturation < 0.22) return lightness < 0.55 ? "EARTH" : "NEUTRAL";

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;

  if (hue < 20 || hue >= 330) return "WARM"; // красный
  if (hue < 45) return lightness < 0.45 ? "EARTH" : "WARM"; // оранжевый: тёмный → охра
  if (hue < 70) return saturation < 0.5 ? "EARTH" : "WARM"; // жёлтый: блёклый → песок
  if (hue < 165) return "GREEN";
  if (hue < 260) return "BLUE";
  return "WARM"; // фиолетовый и пурпурный ближе к тёплой части палитры
}
