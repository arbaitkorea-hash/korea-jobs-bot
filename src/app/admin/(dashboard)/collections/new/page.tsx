import { CollectionForm } from "@/components/admin/collection-form";

export const metadata = { title: "Новая коллекция" };

export default function NewCollectionPage() {
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl">Новая коллекция</h1>
      <CollectionForm
        id={null}
        initial={{ title: "", slug: "", description: "", seoTitle: "", seoDescription: "", ogImage: "", canonicalUrl: "" }}
      />
    </div>
  );
}
