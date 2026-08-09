"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { blogPostAdminSchema } from "@/lib/validation";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export type BlogPostFormInput = {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
};

export async function saveBlogPost(id: string | null, input: BlogPostFormInput) {
  await requireSession();

  const parsed = blogPostAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug: parsed.data.slug } });
  if (existing && existing.id !== id) {
    return { error: "Такой slug уже используется другой статьёй." };
  }

  // Санитизация HTML при сохранении — первая линия защиты от XSS (вторая — на рендере).
  const cleanHtml = DOMPurify.sanitize(parsed.data.contentHtml);

  const data = { ...parsed.data, contentHtml: cleanHtml, publishedAt: parsed.data.published ? new Date() : null };

  if (id) {
    await prisma.blogPost.update({ where: { id }, data });
  } else {
    await prisma.blogPost.create({ data });
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  await requireSession();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
