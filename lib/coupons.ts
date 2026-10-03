import { COLLECTIONS, mergedList } from "./catalog";
import { db } from "./db";

export type Coupon = {
  id: string; code: string; type: "PERCENT" | "FIXED"; value: number; minOrder: number; maxDiscount?: number;
  usageLimit?: number; used: number; expiresAt?: string; active: boolean; deleted?: boolean;
};

export const seedCoupons: Coupon[] = [
  { id: "cp_welcome10", code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 500, maxDiscount: 300, used: 0, active: true },
  { id: "cp_toy100", code: "TOY100", type: "FIXED", value: 100, minOrder: 999, used: 0, active: true },
];

export const getCoupons = () => mergedList<Coupon>(COLLECTIONS.coupons, seedCoupons);

export const describe = (c: Coupon) =>
  `${c.type === "PERCENT" ? `${c.value}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}` : `₹${c.value} off`} on orders over ₹${c.minOrder}`;

export async function lookupCoupon(code: string, itemsTotal: number): Promise<{ coupon?: Coupon; discount: number; error?: string }> {
  const c = (await getCoupons()).find((x) => x.code === code.trim().toUpperCase());
  if (!c || !c.active) return { discount: 0, error: "Invalid coupon code." };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { discount: 0, error: "This coupon has expired." };
  if (c.usageLimit != null && c.used >= c.usageLimit) return { discount: 0, error: "This coupon has reached its usage limit." };
  if (itemsTotal < c.minOrder) return { discount: 0, error: `Add items worth ₹${c.minOrder - itemsTotal} more to use ${c.code}.` };
  let d = c.type === "PERCENT" ? Math.round((itemsTotal * c.value) / 100) : c.value;
  if (c.maxDiscount) d = Math.min(d, c.maxDiscount);
  return { coupon: c, discount: Math.min(d, itemsTotal) };
}

export async function markCouponUsed(c: Coupon) {
  const cur = (await getCoupons()).find((x) => x.id === c.id);
  if (cur) await db.put(COLLECTIONS.coupons, c.id, { ...cur, used: (cur.used ?? 0) + 1 });
}
