import { finalPrice } from "./data";
import { getAllProducts } from "./catalog";
import { describe, lookupCoupon, type Coupon } from "./coupons";

export type CartLine = { productId: string; variantId?: string; qty: number };

export const FREE_SHIPPING_OVER = 999;
export const SHIPPING_FEE = 99;
export const TAX_RATE = 0.05;

export async function quote(input: CartLine[], couponCode?: string) {
  const products = await getAllProducts();
  const lines = [] as any[];
  for (const l of input.slice(0, 50)) {
    const p = products.find((x) => x.id === l.productId);
    if (!p) continue;
    const v = l.variantId ? p.variants.find((x) => x.id === l.variantId) : undefined;
    if (l.variantId && !v) continue;
    const stock = v ? v.stock : p.stock;
    const listPrice = v ? v.price : p.price;
    const unitPrice = finalPrice({ price: listPrice, discountPercent: p.discountPercent });
    const wanted = Math.max(1, Math.floor(Number(l.qty) || 1));
    const qty = Math.min(wanted, stock);
    lines.push({
      productId: p.id, variantId: v?.id, slug: p.slug, name: p.name, variantLabel: v?.label, emoji: p.emoji, colors: p.colors, image: p.images?.[0],
      listPrice, unitPrice, qty, stock, lineTotal: unitPrice * qty,
      issue: stock === 0 ? "Out of stock" : qty < wanted ? `Only ${stock} available` : undefined,
    });
  }
  const valid = lines.filter((l) => l.qty > 0);
  const itemsTotal = valid.reduce((a, l) => a + l.lineTotal, 0);
  const savings = valid.reduce((a, l) => a + (l.listPrice - l.unitPrice) * l.qty, 0);

  let discount = 0;
  let coupon: { code: string; label: string } | null = null;
  let couponError: string | undefined;
  let couponDoc: Coupon | undefined;
  if (couponCode) {
    const r = await lookupCoupon(couponCode, itemsTotal);
    if (r.coupon) { discount = r.discount; couponDoc = r.coupon; coupon = { code: r.coupon.code, label: describe(r.coupon) }; }
    else couponError = r.error;
  }
  const taxable = itemsTotal - discount;
  const shipping = valid.length === 0 || taxable >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const tax = Math.round(taxable * TAX_RATE);
  return { lines, itemsTotal, savings, discount, coupon, couponError, couponDoc, shipping, tax, total: taxable + shipping + tax, count: valid.reduce((a, l) => a + l.qty, 0) };
}
