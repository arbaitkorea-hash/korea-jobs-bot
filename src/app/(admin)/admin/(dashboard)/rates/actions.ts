"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { exchangeRatesSchema } from "@/lib/validation";
import { LOCALES } from "@/lib/i18n/config";
import { logAudit } from "@/lib/audit";

export type RateInput = { base: string; quote: string; rate: string };

export async function saveRates(input: RateInput[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = exchangeRatesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  for (const row of parsed.data) {
    if (row.rate === 0) {
      // Ноль — это «курса нет»: цена тогда показывается в исходной валюте,
      // а не пересчитывается в ноль.
      await prisma.exchangeRate.deleteMany({ where: { base: row.base, quote: row.quote } });
      continue;
    }
    await prisma.exchangeRate.upsert({
      where: { base_quote: { base: row.base, quote: row.quote } },
      update: { rate: row.rate },
      create: { base: row.base, quote: row.quote, rate: row.rate },
    });
  }

  await logAudit({
    event: "SETTINGS_CHANGED",
    severity: "info",
    actor: session.user.email ?? "",
    detail: "Обновлены курсы валют",
  });

  revalidatePath("/admin/rates");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}`, "layout");
  }

  return { ok: true };
}
