import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveImage } from "@/lib/storage";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";

export async function POST(request: Request) {
  // multipart/form-data — "simple request" по CORS: браузер отправит его
  // кросс-доменно вместе с cookie сессии без preflight, поэтому одной
  // проверки сессии недостаточно (CSRF). Server Actions защищены Next.js
  // автоматически, а этот route handler — нет, проверяем Origin вручную.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok } = rateLimit(`upload:${getClientIp(request)}`, 30, 10 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "Слишком много загрузок. Попробуйте позже." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Разрешены только изображения." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await saveImage(buffer);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обработать файл.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
