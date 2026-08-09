import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { ok } = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "Слишком много запросов. Попробуйте позже." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля формы.", issues: parsed.error.flatten() }, { status: 400 });
  }

  // honeypot: если заполнено ботом — молча "успех", без записи в БД
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ ok: true });
}
