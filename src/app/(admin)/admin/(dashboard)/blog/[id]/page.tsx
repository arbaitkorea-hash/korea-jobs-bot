import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";
import { LOCALES, toPrismaLocale, type AppLocale } from "@/lib/i18n/config";
import { emptyBlogTranslation } from "@/lib/admin-defaults";
import type { BlogTranslationInput } from "@/app/(admin)/admin/(dashboard)/blog/actions";

export const metadata = { title: "Редактирование статьи" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { translations: true } });
  if (!post) notFound();

  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const t = post.translations.find((tr) => tr.locale === toPrismaLocale(locale));
      if (!t) return [locale, emptyBlogTranslation()];
      return [
        locale,
        {
          slug: t.slug,
          title: t.title,
          excerpt: t.excerpt,
          contentHtml: t.contentHtml,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          keywords: t.keywords,
          hashtags: t.hashtags,
          canonicalUrl: t.canonicalUrl,
        } satisfies BlogTranslationInput,
      ];
    }),
  ) as Record<AppLocale, BlogTranslationInput>;

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{translations.ru.title || "Статья"}</h1>
      <BlogForm
        id={post.id}
        initial={{ coverImage: post.coverImage, published: post.published, translations }}
      />
    </div>
  );
}
