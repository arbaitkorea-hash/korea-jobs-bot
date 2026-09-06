import type { Orientation } from "@prisma/client";

/**
 * Ориентация работы и порядок сторон — по фотографии, а не по тому, как
 * размеры записаны в таблице.
 *
 * В перечнях размер пишут то как «ширина × высота», то как «высота × ширина»,
 * причём в одном списке вперемешку. Фотография же не врёт: если снимок
 * горизонтальный, а в размерах первым идёт меньшее число — стороны надо
 * поменять местами, иначе на карточке будет «50×70 см» под горизонтальной
 * картиной, а фильтр по ориентации отправит работу не в ту группу.
 */
export function alignSidesToPhoto(
  widthCm: number,
  heightCm: number,
  imageWidth: number,
  imageHeight: number,
): { widthCm: number; heightCm: number; orientation: Orientation } {
  const ratio = imageHeight > 0 ? imageWidth / imageHeight : 1;

  // Допуск в 2%: кадрирование и поля холста никогда не дают идеальный квадрат.
  const photo: Orientation =
    Math.abs(ratio - 1) < 0.02 ? "SQUARE" : ratio > 1 ? "LANDSCAPE" : "PORTRAIT";

  if (photo === "SQUARE" || widthCm === heightCm) {
    return { widthCm, heightCm, orientation: photo };
  }

  const long = Math.max(widthCm, heightCm);
  const short = Math.min(widthCm, heightCm);

  return photo === "LANDSCAPE"
    ? { widthCm: long, heightCm: short, orientation: "LANDSCAPE" }
    : { widthCm: short, heightCm: long, orientation: "PORTRAIT" };
}

/** Ориентация из одних размеров — когда фотографии ещё нет. */
export function orientationFromSides(widthCm: number, heightCm: number): Orientation {
  return widthCm === heightCm ? "SQUARE" : widthCm > heightCm ? "LANDSCAPE" : "PORTRAIT";
}
