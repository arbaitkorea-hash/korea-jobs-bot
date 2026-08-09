import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SeoHealthBadge } from "@/components/admin/seo-health-badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBlogPost } from "@/app/admin/(dashboard)/blog/actions";

export const metadata = { title: "Блог" };

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Блог</h1>
        <Link href="/admin/blog/new"><Button>Новая статья</Button></Link>
      </div>

      <ul className="divide-y divide-border">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center justify-between py-4">
            <div>
              <Link href={`/admin/blog/${post.id}`} className="hover:underline">{post.title}</Link>
              <div className="mt-1 flex items-center gap-3 text-xs text-fg-muted">
                <span>{post.published ? "Опубликовано" : "Черновик"}</span>
                <SeoHealthBadge seoTitle={post.seoTitle} seoDescription={post.seoDescription} slug={post.slug} requireAlt={false} />
              </div>
            </div>
            <DeleteButton action={deleteBlogPost.bind(null, post.id)} />
          </li>
        ))}
      </ul>
      {posts.length === 0 && <p className="text-fg-muted">Пока нет статей.</p>}
    </div>
  );
}
