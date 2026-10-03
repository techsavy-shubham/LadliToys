import { NextResponse } from "next/server";
import { bad, getUser, unauthorized, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { markPaid, markPaymentFailed, type Order } from "@/lib/orders";
import { paymentsFor, razorpayConfigured, savePayment } from "@/lib/payments";

// Sandbox gateway (only active while no real gateway credentials are configured).
export async function POST(req: Request) {
  if (razorpayConfigured()) return bad("Sandbox gateway is disabled.", 403);
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const order = await db.get<Order>("orders", String(b.orderId ?? ""));
  if (!order || order.userId !== u.id) return bad("Order not found.", 404);
  const pay = (await paymentsFor(order.id)).filter((p) => p.provider === "sandbox").pop();
  if (!pay) return bad("Payment not found.", 404);
  const outcome = b.outcome === "success" ? "PAID" : b.outcome === "cancel" ? "CANCELLED" : "FAILED";
  if (pay.status === "PAID") return NextResponse.json({ order });
  pay.status = outcome; if (outcome === "PAID") pay.providerPaymentId = `sbx_pay_${Date.now()}`;
  await savePayment(pay);
  const updated = outcome === "PAID" ? await markPaid(order, u as User) : await markPaymentFailed(order, u as User, outcome as "FAILED" | "CANCELLED");
  return NextResponse.json({ order: updated });
}
