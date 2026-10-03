import { db, type Doc } from "./db";
import * as seed from "./data";
import type { Banner, Brand, Category, Product, ProductQuery } from "./data";

// Admin-managed catalog: seed data (lib/data.ts) merged with edits / additions / deletions stored in the database.
// A stored doc whose id matches a seed record patches it; any other doc is a new record; `deleted: true` hides a record.
export async function mergedList<T extends { id: string }>(col: string, seedList: T[]): Promise<(T & { deleted?: boolean })[]> {
  const docs = await db.list<Doc>(col);
  const byId = new Map(docs.map((d) => [d.id as string, d]));
  const seedIds = new Set(seedList.map((s) => s.id));
  const out = seedList.map((s) => ({ ...s, ...byId.get(s.id) }));
  for (const d of docs) if (!seedIds.has(d.id)) out.push(d as any);
  return out.filter((x: any) => !x.deleted) as any;
}

export async function saveEntity(col: string, seedList: { id: string }[], id: string, patch: Doc) {
  const existing = (await db.get<Doc>(col, id)) ?? {};
  await db.put(col, id, { ...existing, ...patch, id });
}
export async function removeEntity(col: string, seedList: { id: string }[], id: string) {
  if (seedList.some((s) => s.id === id)) await db.put(col, id, { id, deleted: true });
  else await db.del(col, id);
}

export const COLLECTIONS = { products: "cat_products", categories: "cat_categories", brands: "cat_brands", banners: "cat_banners", coupons: "cat_coupons" } as const;

export const getAllProducts = (includeUnpublished = false) =>
  mergedList<Product>(COLLECTIONS.products, seed.products).then((l) => (includeUnpublished ? l : l.filter((p) => p.published)));
export const getCategories = (includeInactive = false) =>
  mergedList<Category>(COLLECTIONS.categories, seed.categories).then((l) => (includeInactive ? l : l.filter((c) => c.active)));
export const getBrands = () => mergedList<Brand>(COLLECTIONS.brands, seed.brands);
export const getBanners = (includeInactive = false) =>
  mergedList<Banner>(COLLECTIONS.banners, seed.banners).then((l) => (includeInactive ? l : l.filter((b) => b.active !== false)));

export async function searchProducts(o: ProductQuery) {
  const [list, cats] = await Promise.all([getAllProducts(), getCategories()]);
  const active = new Set(cats.map((c) => c.slug));
  return seed.queryProducts(o, list.filter((p) => active.has(p.categorySlug)));
}
export const findProduct = async (slug: string) => (await getAllProducts()).find((p) => p.slug === slug);
export const relatedTo = async (p: Product, n = 4) => (await getAllProducts()).filter((x) => x.categorySlug === p.categorySlug && x.id !== p.id).slice(0, n);

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
