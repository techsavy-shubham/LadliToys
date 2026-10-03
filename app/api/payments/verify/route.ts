import { NextResponse } from "next/server";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { markPaid, markPaymentFailed, type Order } from "@/lib/orders";
import { paymentsFor, savePayment, verifyRazorpaySignature } from "@/lib/payments";

// Confirms a Razorpay payment (signature check) or records a failure / cancellation reported by checkout.
export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const order = await db.get<Order>("orders", String(b.orderId ?? ""));
  if (!order || order.userId !== u.id) return bad("Order not found.", 404);
  const pay = (await paymentsFor(order.id)).find((p) => p.providerOrderId === b.razorpay_order_id) ?? (await paymentsFor(order.id)).filter((p) => p.provider === "razorpay").pop();
  if (!pay || pay.provider !== "razorpay") return bad("Payment not found.", 404);

  if (b.outcome === "cancelled" || b.outcome === "failed") {
    if (pay.status === "PAID") return NextResponse.json({ order });
    pay.status = b.outcome === "cancelled" ? "CANCELLED" : "FAILED"; await savePayment(pay);
    return NextResponse.json({ order: await markPaymentFailed(order, u, pay.status as "FAILED" | "CANCELLED") });
  }
  if (!verifyRazorpaySignature(pay.providerOrderId, String(b.razorpay_payment_id ?? ""), String(b.razorpay_signature ?? ""))) {
    pay.status = "FAILED"; await savePayment(pay);
    await markPaymentFailed(order, u, "FAILED");
    return bad("Payment verification failed.", 400);
  }
  pay.status = "PAID"; pay.providerPaymentId = String(b.razorpay_payment_id); await savePayment(pay);
  return NextResponse.json({ order: await markPaid(order, u) });
}
