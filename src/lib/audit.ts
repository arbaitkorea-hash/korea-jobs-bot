import "server-only";
import { prisma } from "@/lib/prisma";
import { blindHash } from "@/lib/crypto";

export type AuditEvent =
  | "LOGIN_FAILED"
  | "LOGIN_SUCCESS"
  | "LOGIN_LOCKED"
  | "RATE_LIMIT"
  | "SUSPICIOUS_ORDER"
  | "UPLOAD_REJECTED"
  | "CSRF_BLOCKED"
  | "BULK_CREATE"
  | "SETTINGS_CHANGED";

type Severity = "info" | "warning" | "critical";

/**
 * Журналирование подозрительной активности (п. 14 аудита безопасности).
 * Пишем хеш IP, а не сам адрес — журнал не должен становиться новым источником
 * персональных данных. Ошибка записи в журнал никогда не роняет основной запрос.
 */
export async function logAudit(params: {
  event: AuditEvent;
  severity?: Severity;
  ip?: string;
  actor?: string;
  detail?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        event: params.event,
        severity: params.severity ?? "info",
        ipHash: params.ip ? blindHash(params.ip) : "",
        actor: params.actor ?? "",
        detail: (params.detail ?? "").slice(0, 500),
      },
    });
  } catch {
    // Журнал — вспомогательная система; его недоступность не повод отказать
    // пользователю в обслуживании.
  }
}
