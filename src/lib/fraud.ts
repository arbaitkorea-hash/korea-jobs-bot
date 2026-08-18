import "server-only";
import { prisma } from "@/lib/prisma";
import { blindHash } from "@/lib/crypto";

/**
 * Базовая антифрод-проверка заявок (п. 10 аудита безопасности).
 *
 * Это не блокировка, а разметка: заявка всё равно сохраняется, но получает
 * riskScore и флаги, чтобы владелец в админке видел, к какой стоит присмотреться.
 * Автоматически отклонять заказы на сайте художника опаснее, чем пропустить
 * подозрительный: ложное срабатывание = потерянный реальный покупатель.
 */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "maildrop.cc",
  "fakeinbox.com",
]);

export type RiskAssessment = {
  score: number;
  flags: string[];
};

export async function assessOrderRisk(params: {
  email: string;
  ip: string;
  customerName: string;
  totalCents: number;
}): Promise<RiskAssessment> {
  const flags: string[] = [];
  let score = 0;

  const emailHash = blindHash(params.email);
  const ipHash = blindHash(params.ip);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Много заявок с одного IP за сутки
  if (ipHash) {
    const fromIp = await prisma.order.count({
      where: { ipHash, createdAt: { gte: dayAgo } },
    });
    if (fromIp >= 5) {
      flags.push("MANY_FROM_IP");
      score += 40;
    } else if (fromIp >= 3) {
      flags.push("REPEAT_FROM_IP");
      score += 15;
    }
  }

  // 2. Повторные заявки с одного email за сутки
  const fromEmail = await prisma.order.count({
    where: { emailHash, createdAt: { gte: dayAgo } },
  });
  if (fromEmail >= 3) {
    flags.push("MANY_FROM_EMAIL");
    score += 25;
  }

  // 3. Одноразовый почтовый домен
  const domain = params.email.split("@")[1]?.toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    flags.push("DISPOSABLE_EMAIL");
    score += 30;
  }

  // 4. Имя, не похожее на имя: одни цифры/символы или подозрительно короткое
  const name = params.customerName.trim();
  if (name.length < 3 || !/[\p{L}]{2,}/u.test(name)) {
    flags.push("SUSPICIOUS_NAME");
    score += 20;
  }

  // 5. Аномально крупная заявка — не мошенничество само по себе,
  // но повод связаться с покупателем в первую очередь.
  if (params.totalCents > 50_000_000_00) {
    flags.push("HIGH_VALUE");
    score += 10;
  }

  return { score: Math.min(score, 100), flags };
}
