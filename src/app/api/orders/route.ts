import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { encrypt, blindHash } from "@/lib/crypto";
import { assessOrderRisk } from "@/lib/fraud";
import { logAudit } from "@/lib/audit";
import { toPrismaLocale } from "@/lib/i18n/config";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const { ok } = rateLimit(`order:${ip}`, 5, 10 * 60 * 1000);
  if (!ok) {
    await logAudit({ event: "RATE_LIMIT", severity: "warning", ip, detail: "POST /api/orders" });
    return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot: отвечаем как при успехе, но ничего не сохраняем.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, orderId: null });
  }

  // Цену клиенту не доверяем: пересчитываем по актуальным данным из БД.
  const artworkIds = [...new Set(parsed.data.items.map((i) => i.artworkId))];
  const artworks = await prisma.artwork.findMany({
    where: { id: { in: artworkIds }, published: true },
  });
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  const verifiedItems = [];
  for (const item of parsed.data.items) {
    const artwork = artworkMap.get(item.artworkId);
    if (!artwork) {
      return NextResponse.json({ error: "Одна из работ больше недоступна." }, { status: 400 });
    }
    if (artwork.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Одна из работ уже продана или зарезервирована." }, { status: 409 });
    }
    const unitPriceCents =
      item.variant === "ORIGINAL" ? artwork.priceOriginalCents : (artwork.pricePrintCents ?? 0);

    verifiedItems.push({
      artworkId: artwork.id,
      titleSnapshot: item.titleSnapshot.slice(0, 300),
      variant: item.variant,
      quantity: item.quantity,
      unitPriceCents,
    });
  }

  const totalCents = verifiedItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  const risk = await assessOrderRisk({
    email: parsed.data.email,
    ip,
    customerName: parsed.data.customerName,
    totalCents,
  });

  const order = await prisma.order.create({
    data: {
      // Персональные данные шифруются на уровне приложения — в БД открытым текстом их нет.
      customerNameEnc: encrypt(parsed.data.customerName),
      emailEnc: encrypt(parsed.data.email),
      phoneEnc: encrypt(parsed.data.phone),
      addressEnc: encrypt(parsed.data.address),
      messageEnc: encrypt(parsed.data.message),
      emailHash: blindHash(parsed.data.email),
      ipHash: blindHash(ip),
      riskScore: risk.score,
      riskFlags: risk.flags.join(","),
      totalCents,
      currency: artworks[0]?.currency ?? "KRW",
      locale: toPrismaLocale(parsed.data.locale),
      items: { create: verifiedItems },
    },
  });

  if (risk.score >= 40) {
    await logAudit({
      event: "SUSPICIOUS_ORDER",
      severity: "warning",
      ip,
      detail: `order=${order.id} score=${risk.score} flags=${risk.flags.join(",")}`,
    });
  }

  await prisma.artwork.updateMany({
    where: { id: { in: artworkIds } },
    data: { buyClicks: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
