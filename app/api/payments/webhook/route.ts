import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { User } from "@/lib/auth";
import { markPaid, markPaymentFailed, type Order } from "@/lib/orders";
import { paymentsFor, savePayment, verifyWebhookSignature } from "@/lib/payments";

// Razorpay webhook (configure RAZORPAY_WEBHOOK_SECRET). Keeps orders in sync even if the customer closes the browser.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || "")) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const ev = JSON.parse(raw);
  const entity = ev?.payload?.payment?.entity;
  const orderId: string | undefined = entity?.notes?.orderId;
  if (!orderId) return NextResponse.json({ ok: true });
  const order = await db.get<Order>("orders", orderId);
  const user = order && (await db.get<User>("users", order.userId));
  if (!order || !user) return NextResponse.json({ ok: true });
  const pay = (await paymentsFor(orderId)).find((p) => p.providerOrderId === entity.order_id);
  if (ev.event === "payment.captured" || ev.event === "order.paid") {
    if (pay) { pay.status = "PAID"; pay.providerPaymentId = entity.id; await savePayment(pay); }
    await markPaid(order, user, "Payment confirmed by gateway");
  } else if (ev.event === "payment.failed") {
    if (pay && pay.status !== "PAID") { pay.status = "FAILED"; await savePayment(pay); }
    await markPaymentFailed(order, user, "FAILED");
  }
  return NextResponse.json({ ok: true });
}
