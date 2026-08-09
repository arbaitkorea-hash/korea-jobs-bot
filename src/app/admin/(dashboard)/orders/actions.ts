"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
}
