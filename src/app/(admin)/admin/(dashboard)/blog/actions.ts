"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { blogPostAdminSchema } from "@/lib/validation";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";

export type BlogTranslationInput = {
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  hashtags: string;
  canonicalUrl: string;
};

export type BlogPostFormInput = {
  coverImage: string;
  published: boolean;
  translations: Record<AppLocale, BlogTranslationInput>;
};

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function saveBlogPost(id: string | null, input: BlogPostFormInput) {
  await requireSession();

  const parsed = blogPostAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  const data = parsed.data;

  for (const locale of LOCALES) {
    const slug = data.translations[locale].slug;
    const clash = await prisma.blogPostTranslation.findFirst({
      where: { locale: toPrismaLocale(locale), slug, ...(id ? { blogPostId: { not: id } } : {}) },
    });
    if (clash) {
      return { error: `Slug "${slug}" (${locale.toUpperCase()}) уже занят другой статьёй.` };
    }
  }

  const core = {
    coverImage: data.coverImage,
    published: data.published,
    publishedAt: data.published ? new Date() : null,
  };

  const post = id
    ? await prisma.blogPost.update({ where: { id }, data: core })
    : await prisma.blogPost.create({ data: core });

  for (const locale of LOCALES) {
    const t = data.translations[locale];
    // Санитизация при сохранении — первая линия защиты от XSS
    // (вторая срабатывает при рендере публичной страницы).
    const payload = {
      slug: t.slug,
      title: t.title,
      excerpt: t.excerpt,
      contentHtml: DOMPurify.sanitize(t.contentHtml),
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      keywords: t.keywords,
      hashtags: t.hashtags,
      canonicalUrl: t.canonicalUrl,
    };
    await prisma.blogPostTranslation.upsert({
      where: { blogPostId_locale: { blogPostId: post.id, locale: toPrismaLocale(locale) } },
      update: payload,
      create: { ...payload, blogPostId: post.id, locale: toPrismaLocale(locale) },
    });
  }

  revalidatePath("/admin/blog");
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/blog/${data.translations[locale].slug}`);
  }

  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  await requireSession();
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  for (const locale of LOCALES) revalidatePath(`/${locale}/blog`);
}
