import { NextResponse } from "next/server";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrder, saveOrder, type Order } from "@/lib/orders";
import { createGatewayOrder } from "@/lib/payments";

// Starts an online payment. Either creates a new order from the cart ({items, addressId, coupon})
// or retries payment for an existing unpaid order ({orderId}).
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  let order: Order | null = null;
  if (b.orderId) {
    order = await db.get<Order>("orders", String(b.orderId));
    if (!order || order.userId !== u.id) return bad("Order not found.", 404);
    if (order.paymentStatus === "PAID" || order.paymentMethod !== "ONLINE" || ["CANCELLED", "REFUNDED"].includes(order.status)) return bad("This order can't be paid online.");
  } else {
    const r = await createOrder(u, { items: Array.isArray(b.items) ? b.items : [], coupon: typeof b.coupon === "string" ? b.coupon : undefined, addressId: b.addressId, method: "ONLINE" });
    if (!r.order) return bad(r.error!);
    order = r.order;
  }
  try {
    const p = await createGatewayOrder(order.id, u.id, order.total, order.number);
    if (order.paymentStatus !== "PENDING") { order.paymentStatus = "PENDING"; await saveOrder(order); }
    return NextResponse.json({
      orderId: order.id, paymentId: p.id, gateway: p.provider, gatewayOrderId: p.providerOrderId, amount: order.total,
      keyId: p.provider === "razorpay" ? process.env.RAZORPAY_KEY_ID : undefined,
      customer: { name: u.name, email: u.email, phone: u.phone },
    });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Could not start payment.", 502);
  }
}
