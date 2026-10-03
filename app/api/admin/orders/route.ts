import { NextResponse } from "next/server";
import { requireAdmin, unauthorized, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { listOrders } from "@/lib/orders";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status"), q = (sp.get("q") || "").toLowerCase();
  const [orders, users] = await Promise.all([listOrders(), db.list<User>("users")]);
  const items = orders.reverse().map((o) => ({ ...o, customer: (() => { const u = users.find((x) => x.id === o.userId); return u ? { id: u.id, name: u.name, email: u.email, phone: u.phone } : null; })() }))
    .filter((o) => (!status || o.status === status) && (!q || o.number.toLowerCase().includes(q) || o.customer?.name.toLowerCase().includes(q) || o.customer?.email.toLowerCase().includes(q)));
  return NextResponse.json({ items: items.slice(0, 200) });
}
