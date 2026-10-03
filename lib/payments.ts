import { createHmac, timingSafeEqual } from "node:crypto";
import { db, newId } from "./db";

// Payment gateway: Razorpay when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are configured (merchant credentials supplied by the client),
// otherwise a built-in sandbox gateway so the full payment flow can be exercised without real money.
export type Payment = {
  id: string; orderId: string; userId: string; provider: "razorpay" | "sandbox"; providerOrderId: string; providerPaymentId?: string;
  amount: number; status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED"; refundId?: string; refundedAmount?: number; createdAt: string; updatedAt: string;
};

export const razorpayConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const auth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

export async function createGatewayOrder(orderId: string, userId: string, amountRupees: number, receipt: string) {
  const now = new Date().toISOString();
  let provider: Payment["provider"] = "sandbox";
  let providerOrderId = newId("sbx");
  if (razorpayConfigured()) {
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST", headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt, notes: { orderId } }),
    });
    if (!r.ok) throw new Error(`Payment gateway error (${r.status})`);
    provider = "razorpay"; providerOrderId = (await r.json()).id;
  }
  const p: Payment = { id: newId("pay"), orderId, userId, provider, providerOrderId, amount: amountRupees, status: "PENDING", createdAt: now, updatedAt: now };
  await db.put("payments", p.id, p);
  return p;
}

export async function paymentsFor(orderId: string) { return (await db.list<Payment>("payments")).filter((p) => p.orderId === orderId); }
export async function savePayment(p: Payment) { p.updatedAt = new Date().toISOString(); await db.put("payments", p.id, p); }

const safeEq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) =>
  safeEq(createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${orderId}|${paymentId}`).digest("hex"), signature || "");
export const verifyWebhookSignature = (raw: string, signature: string) =>
  !!process.env.RAZORPAY_WEBHOOK_SECRET && safeEq(createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex"), signature || "");

export async function refundGatewayPayment(p: Payment, amountRupees: number): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (p.provider === "razorpay" && p.providerPaymentId) {
    const r = await fetch(`https://api.razorpay.com/v1/payments/${p.providerPaymentId}/refund`, {
      method: "POST", headers: { Authorization: auth(), "Content-Type": "application/json" }, body: JSON.stringify({ amount: amountRupees * 100 }),
    });
    const d = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: d.id } : { ok: false, error: d?.error?.description || `Refund failed (${r.status})` };
  }
  return { ok: true, id: newId("rfnd") }; // sandbox / COD: recorded only
}
