import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworks, collections, posts] = await Promise.all([
    prisma.artwork.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/gallery`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/collections`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteConfig.url}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteConfig.url}/exhibitions`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteConfig.url}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/policies/shipping`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteConfig.url}/policies/returns`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteConfig.url}/policies/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const artworkPages: MetadataRoute.Sitemap = artworks.map((a) => ({
    url: `${siteConfig.url}/gallery/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${siteConfig.url}/collections/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteConfig.url}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...artworkPages, ...collectionPages, ...blogPages];
}
