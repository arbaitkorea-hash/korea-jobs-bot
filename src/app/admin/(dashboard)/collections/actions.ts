"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { collectionAdminSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export type CollectionFormInput = {
  title: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
};

export async function saveCollection(id: string | null, input: CollectionFormInput) {
  await requireSession();

  const parsed = collectionAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const existing = await prisma.collection.findUnique({ where: { slug: parsed.data.slug } });
  if (existing && existing.id !== id) {
    return { error: "Такой slug уже используется другой коллекцией." };
  }

  if (id) {
    await prisma.collection.update({ where: { id }, data: parsed.data });
  } else {
    const last = await prisma.collection.findFirst({ orderBy: { position: "desc" } });
    await prisma.collection.create({ data: { ...parsed.data, position: (last?.position ?? 0) + 1 } });
  }

  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect("/admin/collections");
}

export async function deleteCollection(id: string) {
  await requireSession();
  await prisma.collection.delete({ where: { id } });
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
}
