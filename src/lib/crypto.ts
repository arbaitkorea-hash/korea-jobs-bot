import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "node:crypto";

/**
 * Шифрование персональных данных покупателей в БД (п. 13 аудита безопасности).
 *
 * AES-256-GCM: даёт и конфиденциальность, и защиту от подмены (auth tag).
 * Формат хранения: base64(iv):base64(authTag):base64(ciphertext) — одна строка,
 * чтобы не плодить лишние колонки под IV и тег.
 *
 * Ключ берётся из ENCRYPTION_KEY. Если переменная не задана — падаем на старте,
 * а не молча пишем данные открытым текстом: тихая деградация здесь опаснее сбоя.
 */

const ALGO = "aes-256-gcm";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY не задан или короче 32 символов. Сгенерируйте: openssl rand -base64 32",
    );
  }

  // scrypt с фиксированной солью: сама соль не секрет, её задача — растянуть
  // произвольную строку из .env в полноценный 32-байтный ключ.
  cachedKey = scryptSync(secret, "jst-art-pii-v1", 32);
  return cachedKey;
}

export function encrypt(plain: string): string {
  if (!plain) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decrypt(payload: string): string {
  if (!payload) return "";
  const parts = payload.split(":");
  if (parts.length !== 3) return "";

  try {
    const [iv, authTag, ciphertext] = parts.map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    // Повреждённые данные или смена ключа — не роняем всю админку из-за одной записи.
    return "";
  }
}

/**
 * Необратимый хеш для поиска повторов и антифрода (email, IP).
 * С солью из ENCRYPTION_KEY, чтобы по утёкшей базе нельзя было перебрать
 * email/IP по радужным таблицам.
 */
export function blindHash(value: string): string {
  if (!value) return "";
  const secret = process.env.ENCRYPTION_KEY ?? "";
  return createHash("sha256").update(`${secret}:${value.toLowerCase().trim()}`).digest("hex");
}
