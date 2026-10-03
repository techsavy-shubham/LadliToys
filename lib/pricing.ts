import { finalPrice, products as allProducts } from "./data";

export type CartLine = { productId: string; variantId?: string; qty: number };

// Placeholder coupons so cart calculations can be exercised; admin-managed coupons arrive in Milestone 3.
const COUPONS: Record<string, { type: "PERCENT" | "FIXED"; value: number; minOrder: number; maxDiscount?: number; label: string }> = {
  WELCOME10: { type: "PERCENT", value: 10, minOrder: 500, maxDiscount: 300, label: "10% off (max ₹300) on orders over ₹500" },
  TOY100: { type: "FIXED", value: 100, minOrder: 999, label: "₹100 off orders over ₹999" },
};

export const FREE_SHIPPING_OVER = 999;
export const SHIPPING_FEE = 99;
export const TAX_RATE = 0.05;

export function quote(input: CartLine[], couponCode?: string) {
  const lines = [] as any[];
  for (const l of input.slice(0, 50)) {
    const p = allProducts.find((x) => x.id === l.productId && x.published);
    if (!p) continue;
    const v = l.variantId ? p.variants.find((x) => x.id === l.variantId) : undefined;
    if (l.variantId && !v) continue;
    const stock = v ? v.stock : p.stock;
    const listPrice = v ? v.price : p.price;
    const unitPrice = finalPrice({ price: listPrice, discountPercent: p.discountPercent });
    const wanted = Math.max(1, Math.floor(Number(l.qty) || 1));
    const qty = Math.min(wanted, stock);
    lines.push({
      productId: p.id, variantId: v?.id, slug: p.slug, name: p.name, variantLabel: v?.label, emoji: p.emoji, colors: p.colors,
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
  if (couponCode) {
    const code = couponCode.trim().toUpperCase();
    const c = COUPONS[code];
    if (!c) couponError = "Invalid coupon code.";
    else if (itemsTotal < c.minOrder) couponError = `Add items worth ₹${c.minOrder - itemsTotal} more to use ${code}.`;
    else {
      discount = c.type === "PERCENT" ? Math.round((itemsTotal * c.value) / 100) : c.value;
      if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
      discount = Math.min(discount, itemsTotal);
      coupon = { code, label: c.label };
    }
  }
  const taxable = itemsTotal - discount;
  const shipping = valid.length === 0 || taxable >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const tax = Math.round(taxable * TAX_RATE);
  return { lines, itemsTotal, savings, discount, coupon, couponError, shipping, tax, total: taxable + shipping + tax, count: valid.reduce((a, l) => a + l.qty, 0) };
}

