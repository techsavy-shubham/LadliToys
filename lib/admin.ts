import { NextResponse } from "next/server";
import { bad, requireAdmin, str, unauthorized } from "./auth";
import { COLLECTIONS, getAllProducts, getBanners, getBrands, getCategories, removeEntity, saveEntity, slugify } from "./catalog";
import { getCoupons, seedCoupons } from "./coupons";
import * as seed from "./data";
import { ageGroups } from "./data";
import { newId } from "./db";

type Sanitized = { value?: Record<string, any>; error?: string };
type Cfg = {
  col: string; seed: { id: string }[]; prefix: string; list: () => Promise<any[]>;
  sanitize: (b: any, existing: any | undefined, all: any[]) => Sanitized;
  canDelete?: (item: any) => Promise<string | null>;
};

const int = (v: unknown, min = 0, max = 10_000_000) => Math.min(max, Math.max(min, Math.round(Number(v) || 0)));
const bool = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);
const uniqueSlug = (base: string, all: any[], selfId?: string) => {
  let s = slugify(base) || "item", n = 1;
  while (all.some((x) => x.slug === s && x.id !== selfId)) s = `${slugify(base)}-${++n}`;
  return s;
};

export function crud(c: Cfg) {
  return {
    async GET() {
      if (!(await requireAdmin())) return unauthorized();
      return NextResponse.json({ items: await c.list() });
    },
    async POST(req: Request) {
      if (!(await requireAdmin())) return unauthorized();
      const all = await c.list();
      const { value, error } = c.sanitize(await req.json().catch(() => ({})), undefined, all);
      if (!value) return bad(error!);
      const id = newId(c.prefix);
      await saveEntity(c.col, c.seed, id, { ...value, id });
      return NextResponse.json({ item: { ...value, id } }, { status: 201 });
    },
    async PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
      if (!(await requireAdmin())) return unauthorized();
      const { id } = await ctx.params;
      const all = await c.list();
      const existing = all.find((x) => x.id === id);
      if (!existing) return bad("Not found.", 404);
      const { value, error } = c.sanitize({ ...(await req.json().catch(() => ({}))) }, existing, all);
      if (!value) return bad(error!);
      await saveEntity(c.col, c.seed, id, value);
      return NextResponse.json({ item: { ...existing, ...value } });
    },
    async DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
      if (!(await requireAdmin())) return unauthorized();
      const { id } = await ctx.params;
      const existing = (await c.list()).find((x) => x.id === id);
      if (!existing) return bad("Not found.", 404);
      const why = c.canDelete ? await c.canDelete(existing) : null;
      if (why) return bad(why, 409);
      await removeEntity(c.col, c.seed, id);
      return NextResponse.json({ ok: true });
    },
  };
}

const imageUrl = (u: unknown) => typeof u === "string" && (u.startsWith("/api/images/") || /^https:\/\/[^\s]+$/.test(u)) && u.length < 500;

export const products = crud({
  col: COLLECTIONS.products, seed: seed.products, prefix: "p", list: () => getAllProducts(true),
  sanitize(b, ex, all) {
    const m = { ...ex, ...b };
    const name = str(m.name, 120);
    if (name.length < 2) return { error: "Please enter a product name." };
    if (!(Number(m.price) > 0)) return { error: "Price must be greater than 0." };
    if (!str(m.categorySlug) || !str(m.brandSlug)) return { error: "Choose a category and a brand." };
    const variants = (Array.isArray(m.variants) ? m.variants : []).slice(0, 20).map((v: any, i: number) => ({
      id: str(v.id) || `${ex?.sku ?? "V"}-V${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
      sku: str(v.sku) || `${str(m.sku) || "SKU"}-${i + 1}`, label: str(v.label, 60) || `Option ${i + 1}`, price: int(v.price) || int(m.price), stock: int(v.stock),
    }));
    const age = ageGroups.find((a) => a.slug === m.ageGroup) ?? ageGroups[1];
    const sku = str(m.sku, 40) || `LT-${Date.now().toString().slice(-6)}`;
    if (all.some((x) => x.sku === sku && x.id !== ex?.id)) return { error: "SKU already exists." };
    const value: Record<string, any> = {
      name, slug: ex && ex.name === name ? ex.slug : uniqueSlug(name, all, ex?.id), sku, description: str(m.description, 2000),
      price: int(m.price), discountPercent: int(m.discountPercent, 0, 90), categorySlug: str(m.categorySlug), brandSlug: str(m.brandSlug),
      ageGroup: age.slug, ageLabel: str(m.ageLabel, 30) || `${age.min}+ years`, emoji: str(m.emoji, 8) || "🧸",
      material: str(m.material, 200), safety: str(m.safety, 500), featured: bool(m.featured), isNew: bool(m.isNew), published: bool(m.published, true),
      images: (Array.isArray(m.images) ? m.images : []).filter(imageUrl).slice(0, 8), variants,
      stock: variants.length ? variants.reduce((a: number, v: any) => a + v.stock, 0) : int(m.stock),
    };
    if (!ex) Object.assign(value, { colors: ["#fde68a", "#ffffff"], rating: 0, reviewCount: 0, sold: 0, createdAt: new Date().toISOString() });
    return { value };
  },
});

export const categories = crud({
  col: COLLECTIONS.categories, seed: seed.categories, prefix: "c", list: () => getCategories(true),
  sanitize(b, ex, all) {
    const m = { ...ex, ...b }; const name = str(m.name, 60);
    if (name.length < 2) return { error: "Please enter a category name." };
    return { value: { name, slug: ex?.slug ?? uniqueSlug(name, all), emoji: str(m.emoji, 8) || "🧸", color: /^#[0-9a-f]{6}$/i.test(m.color) ? m.color : "#fde68a", active: bool(m.active, true) } };
  },
  canDelete: async (c) => ((await getAllProducts(true)).some((p) => p.categorySlug === c.slug) ? "This category still has products. Deactivate it instead, or move the products first." : null),
});

export const brands = crud({
  col: COLLECTIONS.brands, seed: seed.brands, prefix: "b", list: getBrands,
  sanitize(b, ex, all) {
    const name = str({ ...ex, ...b }.name, 60);
    if (name.length < 2) return { error: "Please enter a brand name." };
    return { value: { name, slug: ex?.slug ?? uniqueSlug(name, all) } };
  },
  canDelete: async (b) => ((await getAllProducts(true)).some((p) => p.brandSlug === b.slug) ? "This brand still has products." : null),
});

export const banners = crud({
  col: COLLECTIONS.banners, seed: seed.banners, prefix: "n", list: () => getBanners(true),
  sanitize(b, ex) {
    const m = { ...ex, ...b }; const title = str(m.title, 80);
    if (title.length < 2) return { error: "Please enter a banner title." };
    const href = str(m.href, 200) || "/products";
    if (!href.startsWith("/") && !href.startsWith("https://")) return { error: "Link must start with / or https://" };
    const col = (v: unknown, d: string) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : d);
    return { value: { title, subtitle: str(m.subtitle, 200), cta: str(m.cta, 40) || "Shop now", href, from: col(m.from, "#fb7185"), to: col(m.to, "#f59e0b"), emoji: str(m.emoji, 8) || "🎉", active: bool(m.active, true) } };
  },
});

export const coupons = crud({
  col: COLLECTIONS.coupons, seed: seedCoupons, prefix: "cp", list: getCoupons,
  sanitize(b, ex, all) {
    const m = { ...ex, ...b }; const code = str(m.code, 20).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (code.length < 3) return { error: "Coupon code must be at least 3 letters/numbers." };
    if (all.some((x) => x.code === code && x.id !== ex?.id)) return { error: "That coupon code already exists." };
    const type = m.type === "FIXED" ? "FIXED" : "PERCENT";
    const value = int(m.value, 1, type === "PERCENT" ? 100 : 1_000_000);
    if (!Number(m.value)) return { error: "Enter a discount value." };
    const exp = m.expiresAt ? new Date(m.expiresAt) : null;
    if (exp && isNaN(exp.getTime())) return { error: "Invalid expiry date." };
    return { value: { code, type, value, minOrder: int(m.minOrder), maxDiscount: m.maxDiscount ? int(m.maxDiscount) : undefined, usageLimit: m.usageLimit ? int(m.usageLimit, 1) : undefined, used: ex?.used ?? 0, expiresAt: exp ? exp.toISOString() : undefined, active: bool(m.active, true) } };
  },
});
