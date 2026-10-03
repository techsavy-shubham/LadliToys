"use client";
import { api } from "./client-state";

declare global { interface Window { Razorpay?: any } }

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// Starts an online payment ({orderId} to retry, or {items,addressId,coupon} for a new order).
// Calls onOrder(orderId) as soon as the order exists, and navigate(path) when finished.
export async function startPayment(body: Record<string, unknown>, onOrder: (orderId: string) => void, navigate: (path: string) => void): Promise<string | null> {
  const r = await api("/api/payments/create", "POST", body);
  if (!r.ok) return r.data.error || "Could not start payment.";
  const d = r.data;
  onOrder(d.orderId);
  if (d.gateway === "sandbox") { navigate(`/pay/sandbox?order=${d.orderId}`); return null; }
  if (!(await loadRazorpay())) { navigate(`/orders/${d.orderId}`); return "Could not load the payment window. You can retry from your order page."; }

  const done = (outcome?: string, extra: Record<string, string> = {}) =>
    api("/api/payments/verify", "POST", { orderId: d.orderId, razorpay_order_id: d.gatewayOrderId, outcome, ...extra }).then(() => navigate(`/orders/${d.orderId}?placed=1`));
  const rz = new window.Razorpay({
    key: d.keyId, amount: d.amount * 100, currency: "INR", name: "Ladli Toys", description: "Toy order", order_id: d.gatewayOrderId,
    prefill: { name: d.customer?.name, email: d.customer?.email, contact: d.customer?.phone }, theme: { color: "#f43f5e" },
    handler: (res: any) => done(undefined, { razorpay_payment_id: res.razorpay_payment_id, razorpay_signature: res.razorpay_signature }),
    modal: { ondismiss: () => done("cancelled") },
  });
  rz.on("payment.failed", () => done("failed"));
  rz.open();
  return null;
}
