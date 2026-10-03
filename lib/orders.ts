import { db, newId } from "./db";
import type { Address } from "./addresses";
import type { User } from "./auth";
import { COLLECTIONS, getAllProducts, saveEntity } from "./catalog";
import { markCouponUsed } from "./coupons";
import { notify } from "./notify";
import { quote, type CartLine } from "./pricing";

export const STATUS_FLOW = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
export const ALL_STATUSES = ["PENDING_PAYMENT", ...STATUS_FLOW, "CANCELLED", "REFUNDED"] as const;

export type OrderItem = { productId: string; variantId?: string; name: string; variantLabel?: string; unitPrice: number; qty: number; emoji: string; colors: [string, string]; slug: string; image?: string };
export type Order = {
  id: string; userId: string; number: string; createdAt: string; status: string; paymentStatus: string; paymentMethod: "COD" | "ONLINE";
  items: OrderItem[]; itemsTotal: number; discount: number; couponCode?: string; couponId?: string; shipping: number; tax: number; total: number;
  address: Omit<Address, "userId" | "isDefault" | "id">;
  history: { status: string; at: string; note?: string }[];
  tracking?: { carrier: string; number: string; url?: string };
  refundedAmount?: number; stockCommitted?: boolean; couponCounted?: boolean;
};

export const listOrders = () => db.list<Order>("orders");

// Reduce (dir = -1) or restore (dir = +1) stock for an order's items.
export async function adjustStock(items: OrderItem[], dir: 1 | -1) {
  const products = await getAllProducts(true);
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) continue;
    if (it.variantId) {
      const variants = p.variants.map((v) => (v.id === it.variantId ? { ...v, stock: Math.max(0, v.stock + dir * it.qty) } : v));
      p.variants = variants; p.stock = variants.reduce((a, v) => a + v.stock, 0);
      await saveEntity(COLLECTIONS.products, [], p.id, { variants, stock: p.stock });
    } else {
      p.stock = Math.max(0, p.stock + dir * it.qty);
      await saveEntity(COLLECTIONS.products, [], p.id, { stock: p.stock });
    }
  }
}

// Commit stock and coupon usage once an order is confirmed (COD placed, or online payment received).
async function commit(o: Order) {
  if (!o.stockCommitted) { await adjustStock(o.items, -1); o.stockCommitted = true; }
  if (o.couponId && !o.couponCounted) { await markCouponUsed({ id: o.couponId } as any); o.couponCounted = true; }
}

export async function saveOrder(o: Order) { await db.put("orders", o.id, o); return o; }

export async function createOrder(user: User, body: { items: CartLine[]; coupon?: string; addressId?: string; method: "COD" | "ONLINE" }) {
  const addr = await db.get<Address>("addresses", String(body.addressId ?? ""));
  if (!addr || addr.userId !== user.id) return { error: "Please choose a delivery address." };
  const q = await quote(body.items, body.coupon);
  const lines = q.lines.filter((l: any) => l.qty > 0);
  if (lines.length === 0) return { error: "Your cart is empty." };
  if (q.lines.some((l: any) => l.issue)) return { error: "Some items in your cart are no longer available in the requested quantity. Please review your cart." };
  const { userId: _u, isDefault: _d, id: _i, ...address } = addr;
  const now = new Date().toISOString();
  const status = body.method === "COD" ? "PLACED" : "PENDING_PAYMENT";
  const order: Order = {
    id: newId("o"), userId: user.id, number: `LT${Date.now().toString().slice(-8)}`, createdAt: now, status, paymentStatus: "PENDING", paymentMethod: body.method,
    items: lines.map((l: any) => ({ productId: l.productId, variantId: l.variantId, name: l.name, variantLabel: l.variantLabel, unitPrice: l.unitPrice, qty: l.qty, emoji: l.emoji, colors: l.colors, slug: l.slug, image: l.image })),
    itemsTotal: q.itemsTotal, discount: q.discount, couponCode: q.coupon?.code, couponId: q.couponDoc?.id, shipping: q.shipping, tax: q.tax, total: q.total, address,
    history: [{ status, at: now, note: body.method === "COD" ? "Order placed" : "Awaiting payment" }],
  };
  if (body.method === "COD") await commit(order);
  await saveOrder(order);
  if (body.method === "COD") await notify(user.email, "order_placed", { name: user.name, number: order.number, total: order.total, id: order.id, method: "COD" });
  return { order };
}

// Called when an online payment succeeds.
export async function markPaid(o: Order, user: { email: string; name: string }, note = "Payment received") {
  if (o.paymentStatus === "PAID") return o;
  o.paymentStatus = "PAID";
  if (o.status === "PENDING_PAYMENT") { o.status = "PLACED"; o.history.push({ status: "PLACED", at: new Date().toISOString(), note }); }
  await commit(o);
  await saveOrder(o);
  await notify(user.email, "payment_success", { name: user.name, number: o.number, total: o.total });
  await notify(user.email, "order_placed", { name: user.name, number: o.number, total: o.total, id: o.id, method: "ONLINE" });
  return o;
}

export async function markPaymentFailed(o: Order, user: { email: string; name: string }, status: "FAILED" | "CANCELLED") {
  if (o.paymentStatus === "PAID") return o;
  o.paymentStatus = status;
  o.history.push({ status: o.status, at: new Date().toISOString(), note: status === "FAILED" ? "Payment failed" : "Payment cancelled" });
  await saveOrder(o);
  await notify(user.email, "payment_failed", { name: user.name, number: o.number, id: o.id });
  return o;
}

export async function changeStatus(o: Order, status: string, user: { email: string; name: string }, note?: string) {
  if (status === o.status) return o;
  if (status === "CANCELLED" && o.stockCommitted) { await adjustStock(o.items, 1); o.stockCommitted = false; }
  o.status = status;
  o.history.push({ status, at: new Date().toISOString(), note });
  if (status === "DELIVERED" && o.paymentMethod === "COD") o.paymentStatus = "PAID";
  await saveOrder(o);
  if (status === "SHIPPED") await notify(user.email, "shipped", { name: user.name, number: o.number, id: o.id, carrier: o.tracking?.carrier, trackingNumber: o.tracking?.number });
  else if (status === "DELIVERED") await notify(user.email, "delivered", { name: user.name, number: o.number, id: o.id });
  else if (status === "CANCELLED") await notify(user.email, "order_cancelled", { name: user.name, number: o.number });
  else if (status !== "REFUNDED") await notify(user.email, "status_update", { name: user.name, number: o.number, status, id: o.id });
  return o;
}
