import type { ArtworkTranslationInput } from "@/app/(admin)/admin/(dashboard)/artworks/actions";
import type { CollectionTranslationInput } from "@/app/(admin)/admin/(dashboard)/collections/actions";
import type { BlogTranslationInput } from "@/app/(admin)/admin/(dashboard)/blog/actions";

export function emptyArtworkTranslation(): ArtworkTranslationInput {
  return {
    slug: "",
    title: "",
    description: "",
    story: "",
    altText: "",
    seoTitle: "",
    seoDescription: "",
    ogTitle: "",
    ogDescription: "",
    keywords: "",
    hashtags: "",
    canonicalUrl: "",
  };
}

export function emptyCollectionTranslation(): CollectionTranslationInput {
  return {
    slug: "",
    title: "",
    description: "",
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    hashtags: "",
    canonicalUrl: "",
  };
}

export function emptyBlogTranslation(): BlogTranslationInput {
  return {
    slug: "",
    title: "",
    excerpt: "",
    contentHtml: "",
    seoTitle: "",
    seoDescription: "",
    keywords: "",
    hashtags: "",
    canonicalUrl: "",
  };
}
