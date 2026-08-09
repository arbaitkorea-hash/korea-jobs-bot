/**
 * Простой in-memory rate limiter (token bucket на IP+ключ).
 *
 * Ограничение: состояние живёт в памяти процесса, поэтому на serverless-платформе
 * с несколькими инстансами лимит не общий между ними (best-effort защита от спама,
 * не строгая гарантия). Для строгого лимита на проде — бесплатный тариф Upstash Redis
 * (@upstash/ratelimit) без изменения интерфейса этой функции.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

// Периодическая очистка, чтобы карта не росла бесконечно на долгоживущем процессе.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
