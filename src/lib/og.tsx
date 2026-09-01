import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { AppLocale } from "@/lib/i18n/config";

/** Размер карточки для Open Graph и Twitter — единый стандарт 1.91:1. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const SAFE_MEDIA = /^\/api\/media\/([0-9a-f-]{36}-(?:full|thumb)\.webp)$/;

/**
 * Картина для OG-карточки в виде data-URI.
 *
 * Два ограничения диктуют реализацию. Первое: satori (движок ImageResponse)
 * не умеет webp, а мы храним именно webp — поэтому пережимаем в JPEG. Второе:
 * путь берём только тот, что сами выдали при загрузке, и читаем файл с диска,
 * а не по HTTP — при генерации на сборке сервер ещё не отвечает сам себе.
 */
export async function artworkImageDataUri(
  url: string | undefined,
  width = 600,
  height = 630,
): Promise<string | null> {
  if (!url) return null;
  const match = SAFE_MEDIA.exec(url);
  if (!match) return null;

  try {
    const file = await readFile(path.join(UPLOAD_DIR, match[1]));
    const jpeg = await sharp(file)
      .resize(width, height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 78 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };

const fontCache = new Map<string, ArrayBuffer | null>();

/**
 * Подгружаем ровно те глифы, что стоят на карточке (`&text=`), — Google отдаёт
 * подмножество шрифта в пару килобайт вместо шеститмегабайтного Noto Sans KR.
 * Без этого корейская карточка либо весит как всё приложение, либо рисуется
 * квадратами. UA не подделываем намеренно: браузерам Google отдаёт woff2,
 * который satori не читает, а «безымянному» клиенту — ttf.
 */
async function loadSubset(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  // Для подмножества важен набор символов, а не сам текст: сжимаем строку до
  // уникальных символов. Это и укорачивает URL (длинное название работы иначе
  // упирается в лимит Google), и схлопывает кэш — у сотни работ на одном языке
  // набор букв почти одинаковый, значит и запрос будет один.
  const chars = Array.from(new Set(Array.from(text))).sort().join("").slice(0, 400);
  const key = `${family}|${weight}|${chars}`;
  const cached = fontCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const cssUrl =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
      `&text=${encodeURIComponent(chars)}`;
    const css = await fetch(cssUrl).then((r) => (r.ok ? r.text() : ""));
    // У подмножества шрифта нет расширения в URL, поэтому ориентируемся на
    // format('truetype') — единственный формат, который читает satori.
    const url = /src:\s*url\((https:\/\/[^)]+)\)\s*format\('truetype'\)/.exec(css)?.[1];
    if (!url) throw new Error("no truetype font in css");

    const data = await fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null));
    // Кэш живёт всё время работы процесса, поэтому у него есть потолок:
    // без него редкие карточки постепенно съели бы память инстанса.
    if (fontCache.size > 50) fontCache.clear();
    fontCache.set(key, data);
    return data;
  } catch {
    // Сеть недоступна — карточка отрисуется дефолтным шрифтом ImageResponse.
    // Хуже выглядит, но раздача превью не должна падать из-за шрифта.
    fontCache.set(key, null);
    return null;
  }
}

/**
 * Шрифты под конкретный текст карточки. Для корейского берём Noto Serif KR:
 * Playfair Display не содержит хангыля, и заголовок превратился бы в квадраты.
 */
export async function ogFonts(locale: AppLocale, text: string): Promise<FontSpec[]> {
  const family = locale === "ko" ? "Noto Serif KR" : "Playfair Display";
  const fonts: FontSpec[] = [];

  for (const weight of [400, 700] as const) {
    const data = await loadSubset(family, weight, text);
    if (data) fonts.push({ name: "OgSerif", data, weight, style: "normal" });
  }

  // Запасное семейство для символов, которых нет в заголовочном шрифте:
  // в Playfair Display, например, нет знака вона (₩), и цена корейской
  // работы на русской карточке выводилась квадратом.
  const fallback = await loadSubset("Noto Sans", 400, text);
  if (fallback) fonts.push({ name: "OgFallback", data: fallback, weight: 400, style: "normal" });

  return fonts;
}

/** Палитра карточки — та же, что у тёмной темы сайта. */
export const OG_COLORS = {
  bg: "#141312",
  fg: "#F2EFEA",
  muted: "#A8A29B",
  accent: "#C2A36B",
};

/**
 * Общая рамка карточки: тёмный фон, тонкая линия акцента сверху и подпись
 * бренда снизу. Содержимое передаётся детьми, чтобы карточки работы, статьи
 * и раздела выглядели как одна серия, а не три разные картинки.
 */
export function OgFrame({
  children,
  accent = OG_COLORS.accent,
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: OG_COLORS.bg,
        color: OG_COLORS.fg,
        fontFamily: "OgSerif, OgFallback, serif",
        position: "relative",
      }}
    >
      {children}
      {/* Акцентная полоса рисуется последней: иначе её перекрыла бы картина,
          которая идёт следом в потоке и занимает левую половину карточки. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: accent,
          display: "flex",
        }}
      />
    </div>
  );
}

/**
 * Запасная обложка, если шрифт не загрузился: satori без единого шрифта
 * не умеет считать layout и падает, а превью ссылки — не та вещь, из-за
 * которой страница должна отдавать 500. Отдаём заранее нарисованный файл.
 */
export async function fallbackOgResponse(): Promise<Response> {
  const file = await readFile(path.join(process.cwd(), "public", "og-default.jpg"));
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" },
  });
}
