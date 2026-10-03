import { db, newId } from "./db";
import { formatPrice } from "./data";

// Transactional notifications. Every message is recorded in the "notifications" log (visible to admins).
// If RESEND_API_KEY and MAIL_FROM are set, the message is also delivered by email via Resend; otherwise it is only logged.
export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

type Msg = { subject: string; text: string };
const site = () => process.env.NEXT_PUBLIC_SITE_URL || "https://ladli-toys.vercel.app";
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const templates = {
  registered: (d: { name: string }): Msg => ({ subject: "Welcome to Ladli Toys! 🧸", text: `Hi ${d.name},\n\nThanks for creating your Ladli Toys account. Browse our latest toys any time: ${site()}/products\n\nHappy playing!\nLadli Toys` }),
  password_reset: (d: { name: string; link: string }): Msg => ({ subject: "Reset your Ladli Toys password", text: `Hi ${d.name},\n\nUse this link to choose a new password (valid for 1 hour):\n${site()}${d.link}\n\nIf you didn't ask for this, you can ignore this email.` }),
  order_placed: (d: { name: string; number: string; total: number; id: string; method: string }): Msg => ({ subject: `Order #${d.number} confirmed`, text: `Hi ${d.name},\n\nWe've received your order #${d.number} (${formatPrice(d.total)}, ${d.method === "COD" ? "Cash on Delivery" : "online payment"}).\nTrack it here: ${site()}/orders/${d.id}\n\nThank you for shopping with Ladli Toys!` }),
  payment_success: (d: { name: string; number: string; total: number }): Msg => ({ subject: `Payment received for order #${d.number}`, text: `Hi ${d.name},\n\nWe've received your payment of ${formatPrice(d.total)} for order #${d.number}. Thank you!` }),
  payment_failed: (d: { name: string; number: string; id: string }): Msg => ({ subject: `Payment failed for order #${d.number}`, text: `Hi ${d.name},\n\nYour payment for order #${d.number} didn't go through. You can retry here: ${site()}/orders/${d.id}` }),
  status_update: (d: { name: string; number: string; status: string; id: string }): Msg => ({ subject: `Order #${d.number}: ${label(d.status)}`, text: `Hi ${d.name},\n\nYour order #${d.number} is now "${label(d.status)}".\nTrack it: ${site()}/orders/${d.id}` }),
  shipped: (d: { name: string; number: string; id: string; carrier?: string; trackingNumber?: string }): Msg => ({ subject: `Order #${d.number} has shipped 🚚`, text: `Hi ${d.name},\n\nGood news - your order #${d.number} is on its way${d.carrier ? ` with ${d.carrier}` : ""}${d.trackingNumber ? ` (tracking: ${d.trackingNumber})` : ""}.\nTrack it: ${site()}/orders/${d.id}` }),
  delivered: (d: { name: string; number: string; id: string }): Msg => ({ subject: `Order #${d.number} delivered 🎉`, text: `Hi ${d.name},\n\nYour order #${d.number} has been delivered. We hope your little one loves it! Leave a review: ${site()}/orders/${d.id}` }),
  order_cancelled: (d: { name: string; number: string }): Msg => ({ subject: `Order #${d.number} cancelled`, text: `Hi ${d.name},\n\nYour order #${d.number} has been cancelled. If you paid online, any refund will be processed to your original payment method.` }),
  refund: (d: { name: string; number: string; amount: number }): Msg => ({ subject: `Refund issued for order #${d.number}`, text: `Hi ${d.name},\n\nA refund of ${formatPrice(d.amount)} has been issued for order #${d.number}.` }),
};
type Templates = typeof templates;

export async function notify<K extends keyof Templates>(to: string, event: K, data: Parameters<Templates[K]>[0]) {
  const { subject, text } = (templates[event] as (d: any) => Msg)(data);
  let status: "sent" | "logged" | "failed" = "logged";
  let error: string | undefined;
  if (emailConfigured()) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
      });
      status = r.ok ? "sent" : "failed";
      if (!r.ok) error = (await r.text()).slice(0, 200);
    } catch (e) { status = "failed"; error = String(e).slice(0, 200); }
  }
  const id = newId("n");
  await db.put("notifications", id, { id, to, event, subject, text, status, error, at: new Date().toISOString() }).catch(() => {});
}
