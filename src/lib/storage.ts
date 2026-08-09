import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Локальное файловое хранилище для разработки. Файлы лежат в `storage/uploads`
 * (ВНЕ `public/`, вне пути, откуда сервер отдаёт статику напрямую) и раздаются
 * только через контролируемый route handler `/api/media/[filename]`, который
 * сам выставляет корректный Content-Type и не позволяет обход пути.
 *
 * На проде (Vercel) файловая система эфемерна и доступна на запись только в /tmp —
 * для продакшена подключите объектное хранилище с S3-совместимым API и бесплатным
 * тарифом, например Supabase Storage или Cloudinary, реализовав тот же интерфейс
 * ниже (saveImage) без изменений в остальном коде.
 */

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_OUTPUT_WIDTHS = [1800, 900, 400] as const;

export type StoredImage = {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  format: "webp";
};

export async function saveImage(buffer: Buffer): Promise<StoredImage> {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Файл слишком большой (максимум 10 МБ).");
  }

  // Проверяем реальный формат по содержимому (magic bytes через sharp), а не по
  // расширению/заголовку из запроса — их легко подделать.
  const image = sharp(buffer, { failOn: "error" });
  const metadata = await image.metadata().catch(() => null);
  if (!metadata || !metadata.format || !["jpeg", "png", "webp", "avif"].includes(metadata.format)) {
    throw new Error("Файл не распознан как изображение (jpeg/png/webp/avif).");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const id = randomUUID();
  const fullWidth = Math.min(metadata.width ?? ALLOWED_OUTPUT_WIDTHS[0], ALLOWED_OUTPUT_WIDTHS[0]);

  const full = sharp(buffer).rotate().resize({ width: fullWidth, withoutEnlargement: true }).webp({ quality: 86 });
  const fullBuffer = await full.toBuffer({ resolveWithObject: true });

  const thumb = sharp(buffer).rotate().resize({ width: 400, withoutEnlargement: true }).webp({ quality: 80 });
  const thumbBuffer = await thumb.toBuffer();

  const fullName = `${id}-full.webp`;
  const thumbName = `${id}-thumb.webp`;

  await writeFile(path.join(UPLOAD_DIR, fullName), fullBuffer.data);
  await writeFile(path.join(UPLOAD_DIR, thumbName), thumbBuffer);

  return {
    url: `/api/media/${fullName}`,
    thumbUrl: `/api/media/${thumbName}`,
    width: fullBuffer.info.width,
    height: fullBuffer.info.height,
    format: "webp",
  };
}
