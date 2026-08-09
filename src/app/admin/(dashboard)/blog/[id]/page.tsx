import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata = { title: "Редактирование статьи" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">{post.title}</h1>
      <BlogForm id={post.id} initial={post} />
    </div>
  );
}
