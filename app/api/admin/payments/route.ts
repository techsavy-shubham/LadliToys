import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { listOrders } from "@/lib/orders";
import type { Payment } from "@/lib/payments";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const [pays, orders] = await Promise.all([db.list<Payment>("payments"), listOrders()]);
  const items = pays.map((p) => ({ ...p, orderNumber: orders.find((o) => o.id === p.orderId)?.number })).reverse();
  return NextResponse.json({ items });
}
