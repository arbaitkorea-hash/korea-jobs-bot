import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { ok } = rateLimit(`order:${ip}`, 5, 10 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля формы.", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true, orderId: null });
  }

  // Никогда не доверяем цене с клиента: пересчитываем по актуальным данным из БД.
  const artworkIds = [...new Set(parsed.data.items.map((i) => i.artworkId))];
  const artworks = await prisma.artwork.findMany({ where: { id: { in: artworkIds } } });
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  const verifiedItems = [];
  for (const item of parsed.data.items) {
    const artwork = artworkMap.get(item.artworkId);
    if (!artwork) {
      return NextResponse.json({ error: "Одна из картин больше недоступна." }, { status: 400 });
    }
    const unitPriceCents =
      item.variant === "ORIGINAL" ? artwork.priceOriginalCents : (artwork.pricePrintCents ?? 0);
    verifiedItems.push({
      artworkId: artwork.id,
      titleSnapshot: artwork.title,
      variant: item.variant,
      quantity: item.quantity,
      unitPriceCents,
    });
  }

  const totalCents = verifiedItems.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      customerName: parsed.data.customerName,
      email: parsed.data.email,
      phone: parsed.data.phone || "",
      address: parsed.data.address || "",
      message: parsed.data.message || "",
      totalCents,
      currency: artworks[0]?.currency ?? "KRW",
      items: { create: verifiedItems },
    },
  });

  await prisma.artwork.updateMany({
    where: { id: { in: artworkIds } },
    data: { buyClicks: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, orderId: order.id });
}
