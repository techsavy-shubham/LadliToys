import { NextResponse } from "next/server";
import { publicUser, requireAdmin, unauthorized, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { listOrders } from "@/lib/orders";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const [users, orders] = await Promise.all([db.list<User>("users"), listOrders()]);
  const items = users.filter((u) => u.role !== "ADMIN").map((u) => {
    const mine = orders.filter((o) => o.userId === u.id && !["CANCELLED", "REFUNDED", "PENDING_PAYMENT"].includes(o.status));
    return { ...publicUser(u), active: u.active, orderCount: mine.length, totalSpent: mine.reduce((a, o) => a + o.total, 0) };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ items });
}
