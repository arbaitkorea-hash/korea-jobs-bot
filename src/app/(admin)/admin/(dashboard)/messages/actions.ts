"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Удаление обращения. Также единственный способ выполнить запрос
 * «удалите мои данные» из политики конфиденциальности.
 */
export async function deleteContactMessage(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
}
