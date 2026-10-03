import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";
const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ladli-toys.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  return [
    { url: site, changeFrequency: "daily", priority: 1 },
    { url: `${site}/products`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${site}/products?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${site}/products/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
