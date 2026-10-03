import { NextResponse } from "next/server";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { changeStatus, type Order } from "@/lib/orders";

// Customers can cancel an order until it is processed (and before any online payment was taken).
// Cancelling puts the reserved stock back on the shelf and emails the customer.
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser();
  if (!u) return unauthorized();
  const o = await db.get<Order>("orders", (await params).id);
  if (!o || o.userId !== u.id) return bad("Order not found.", 404);
  if (!["PENDING_PAYMENT", "PLACED", "CONFIRMED"].includes(o.status)) return bad("This order is already being processed and can no longer be cancelled online. Please contact the store.");
  if (o.paymentStatus === "PAID" && o.paymentMethod === "ONLINE") return bad("This order has been paid online. Please contact the store to cancel and receive a refund.");
  return NextResponse.json({ order: await changeStatus(o, "CANCELLED", u, "Cancelled by customer") });
}
