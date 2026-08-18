import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { encrypt, blindHash } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { toPrismaLocale } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { ok } = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!ok) {
    await logAudit({ event: "RATE_LIMIT", severity: "warning", ip, detail: "POST /api/contact" });
    return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot: молча "успех", без записи в БД.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  await prisma.contactMessage.create({
    data: {
      nameEnc: encrypt(parsed.data.name),
      emailEnc: encrypt(parsed.data.email),
      messageEnc: encrypt(parsed.data.message),
      emailHash: blindHash(parsed.data.email),
      ipHash: blindHash(ip),
      locale: toPrismaLocale(parsed.data.locale),
    },
  });

  return NextResponse.json({ ok: true });
}
