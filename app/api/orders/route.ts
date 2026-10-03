import { NextResponse } from "next/server";
import type { Address } from "@/lib/addresses";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { quote } from "@/lib/pricing";

export type Order = {
  id: string; userId: string; number: string; createdAt: string; status: string; paymentStatus: string; paymentMethod: string;
  items: { productId: string; variantId?: string; name: string; variantLabel?: string; unitPrice: number; qty: number; emoji: string; colors: [string, string]; slug: string }[];
  itemsTotal: number; discount: number; couponCode?: string; shipping: number; tax: number; total: number; address: Omit<Address, "userId" | "isDefault" | "id">;
};

export async function GET() {
  const u = await getUser();
  if (!u) return unauthorized();
  const items = (await db.list<Order>("orders")).filter((o) => o.userId === u.id).reverse();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const addr = await db.get<Address>("addresses", String(b.addressId ?? ""));
  if (!addr || addr.userId !== u.id) return bad("Please choose a delivery address.");
  if (b.paymentMethod !== "COD") return bad("Online payment will be available once the payment gateway is connected. Please choose Cash on Delivery.");

  const q = quote(Array.isArray(b.items) ? b.items : [], typeof b.coupon === "string" ? b.coupon : undefined);
  const lines = q.lines.filter((l: any) => l.qty > 0);
  if (lines.length === 0) return bad("Your cart is empty.");
  if (q.lines.some((l: any) => l.issue)) return bad("Some items in your cart are no longer available in the requested quantity. Please review your cart.");

  const id = newId("o");
  const { userId: _u, isDefault: _d, id: _i, ...address } = addr;
  const order: Order = {
    id, userId: u.id, number: `LT${Date.now().toString().slice(-8)}`, createdAt: new Date().toISOString(),
    status: "PLACED", paymentStatus: "PENDING", paymentMethod: "COD",
    items: lines.map((l: any) => ({ productId: l.productId, variantId: l.variantId, name: l.name, variantLabel: l.variantLabel, unitPrice: l.unitPrice, qty: l.qty, emoji: l.emoji, colors: l.colors, slug: l.slug })),
    itemsTotal: q.itemsTotal, discount: q.discount, couponCode: q.coupon?.code, shipping: q.shipping, tax: q.tax, total: q.total, address,
  };
  await db.put("orders", id, order);
  return NextResponse.json({ order }, { status: 201 });
}
