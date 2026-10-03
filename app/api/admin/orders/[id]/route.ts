import { NextResponse } from "next/server";
import { bad, requireAdmin, str, unauthorized, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { ALL_STATUSES, changeStatus, saveOrder, type Order } from "@/lib/orders";
import { paymentsFor, refundGatewayPayment, savePayment } from "@/lib/payments";

type Ctx = { params: Promise<{ id: string }> };

async function load(id: string) {
  const o = await db.get<Order>("orders", id);
  const u = o ? await db.get<User>("users", o.userId) : null;
  return { o, u };
}

export async function GET(_: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { o, u } = await load((await params).id);
  if (!o) return bad("Not found.", 404);
  return NextResponse.json({ order: o, customer: u && { id: u.id, name: u.name, email: u.email, phone: u.phone }, payments: await paymentsFor(o.id) });
}

// Actions: { status, note } | { tracking: {carrier, number, url} } | { action: "cancel" } | { action: "refund", amount }
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { o, u } = await load((await params).id);
  if (!o || !u) return bad("Not found.", 404);
  const b = await req.json().catch(() => ({}));

  if (b.tracking) {
    o.tracking = { carrier: str(b.tracking.carrier, 60), number: str(b.tracking.number, 60), url: /^https:\/\//.test(b.tracking.url ?? "") ? str(b.tracking.url, 300) : undefined };
    await saveOrder(o);
  }
  if (b.action === "cancel") {
    if (["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status)) return bad("This order can no longer be cancelled.");
    await changeStatus(o, "CANCELLED", u, str(b.note) || "Cancelled by store");
  } else if (b.action === "refund") {
    if (o.paymentStatus !== "PAID") return bad("Only paid orders can be refunded.");
    const amount = Math.min(o.total - (o.refundedAmount ?? 0), Math.max(1, Math.round(Number(b.amount) || o.total)));
    if (amount <= 0) return bad("This order has already been fully refunded.");
    const pay = (await paymentsFor(o.id)).find((p) => p.status === "PAID" || p.status === "REFUNDED");
    if (pay) {
      const r = await refundGatewayPayment(pay, amount);
      if (!r.ok) return bad(r.error || "Refund failed.", 502);
      pay.refundId = r.id; pay.refundedAmount = (pay.refundedAmount ?? 0) + amount;
      if (pay.refundedAmount >= pay.amount) pay.status = "REFUNDED";
      await savePayment(pay);
    }
    o.refundedAmount = (o.refundedAmount ?? 0) + amount;
    const full = o.refundedAmount >= o.total;
    if (full) o.paymentStatus = "REFUNDED";
    o.history.push({ status: full ? "REFUNDED" : o.status, at: new Date().toISOString(), note: `Refund of ₹${amount} recorded${pay ? "" : " (cash order – refund manually)"}` });
    if (full) await changeStatus(o, "REFUNDED", u, "Fully refunded"); else await saveOrder(o);
    await notify(u.email, "refund", { name: u.name, number: o.number, amount });
  } else if (b.status) {
    if (!(ALL_STATUSES as readonly string[]).includes(b.status) || b.status === "PENDING_PAYMENT") return bad("Invalid status.");
    if (o.status === "PENDING_PAYMENT" && o.paymentStatus !== "PAID" && b.status !== "CANCELLED") return bad("Awaiting payment — the order can't progress until it's paid.");
    if (["CANCELLED", "REFUNDED"].includes(o.status)) return bad("This order is closed.");
    await changeStatus(o, b.status, u, str(b.note) || undefined);
  } else if (b.tracking) {
    // tracking-only update: add a history note
    o.history.push({ status: o.status, at: new Date().toISOString(), note: `Tracking updated: ${o.tracking?.carrier} ${o.tracking?.number}` });
    await saveOrder(o);
  }
  return NextResponse.json({ order: o });
}
