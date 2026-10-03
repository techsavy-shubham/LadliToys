import { NextResponse } from "next/server";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { createOrder, listOrders } from "@/lib/orders";

export async function GET() {
  const u = await getUser();
  if (!u) return unauthorized();
  const items = (await listOrders()).filter((o) => o.userId === u.id).reverse();
  return NextResponse.json({ items });
}

// Cash-on-delivery checkout. Online payments go through /api/payments/create.
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  if (b.paymentMethod !== "COD") return bad("Please choose a payment method.");
  const r = await createOrder(u, { items: Array.isArray(b.items) ? b.items : [], coupon: typeof b.coupon === "string" ? b.coupon : undefined, addressId: b.addressId, method: "COD" });
  if (!r.order) return bad(r.error!);
  return NextResponse.json({ order: r.order }, { status: 201 });
}
