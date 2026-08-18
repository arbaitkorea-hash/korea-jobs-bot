import { BlogForm } from "@/components/admin/blog-form";
import { emptyBlogTranslation } from "@/lib/admin-defaults";

export const metadata = { title: "Новая статья" };

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Новая статья</h1>
      <BlogForm
        id={null}
        initial={{
          coverImage: "",
          published: false,
          translations: {
            ru: emptyBlogTranslation(),
            en: emptyBlogTranslation(),
            ko: emptyBlogTranslation(),
          },
        }}
      />
    </div>
  );
}
