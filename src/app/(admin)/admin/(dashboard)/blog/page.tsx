import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { LocaleSeoDots } from "@/components/admin/locale-seo-dots";
import { deleteBlogPost } from "@/app/(admin)/admin/(dashboard)/blog/actions";
import { LOCALES, toPrismaLocale } from "@/lib/i18n/config";

export const metadata = { title: "Блог" };

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { translations: true },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Блог</h1>
        <Link href="/admin/blog/new">
          <Button>Новая статья</Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-fg-muted">Пока нет статей.</p>
      ) : (
        <ul className="divide-y divide-border">
          {posts.map((post) => {
            const byLocale = Object.fromEntries(
              LOCALES.map((locale) => {
                const t = post.translations.find((tr) => tr.locale === toPrismaLocale(locale));
                return [
                  locale,
                  {
                    slug: t?.slug ?? "",
                    title: t?.title ?? "",
                    seoTitle: t?.seoTitle ?? "",
                    seoDescription: t?.seoDescription ?? "",
                  },
                ];
              }),
            );

            return (
              <li key={post.id} className="flex items-center justify-between py-4">
                <div>
                  <Link href={`/admin/blog/${post.id}`} className="hover:underline">
                    {byLocale.ru.title || "(без названия)"}
                  </Link>
                  <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                    <span>{post.published ? "Опубликовано" : "Черновик"}</span>
                    <LocaleSeoDots byLocale={byLocale} requireAlt={false} />
                  </div>
                </div>
                <DeleteButton action={deleteBlogPost.bind(null, post.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
