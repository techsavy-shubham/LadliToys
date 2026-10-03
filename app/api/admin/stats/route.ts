import { NextResponse } from "next/server";
import { requireAdmin, unauthorized, type User } from "@/lib/auth";
import { getAllProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { listOrders } from "@/lib/orders";

const LOW_STOCK = 10;
const counted = (s: string) => !["CANCELLED", "REFUNDED", "PENDING_PAYMENT"].includes(s);

export async function GET(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const [orders, users, products] = await Promise.all([listOrders(), db.list<User>("users"), getAllProducts(true)]);
  const customers = users.filter((u) => u.role !== "ADMIN");
  const since = Date.now() - days * 864e5;
  const valid = orders.filter((o) => counted(o.status));
  const inRange = valid.filter((o) => new Date(o.createdAt).getTime() >= since);
  const revenue = (l: typeof valid) => l.reduce((a, o) => a + o.total - (o.refundedAmount ?? 0), 0);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) byDay.set(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  for (const o of inRange) { const d = byDay.get(o.createdAt.slice(0, 10)); if (d) { d.revenue += o.total; d.orders++; } }

  const sold = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of inRange) for (const i of o.items) {
    const s = sold.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
    s.qty += i.qty; s.revenue += i.qty * i.unitPrice; sold.set(i.productId, s);
  }
  const lowStock = products.filter((p) => p.published && p.stock < LOW_STOCK).sort((a, b) => a.stock - b.stock).map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock }));

  return NextResponse.json({
    days,
    totals: {
      sales: revenue(valid), orders: orders.length, customers: customers.length, products: products.length,
      pending: orders.filter((o) => ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status)).length,
      completed: orders.filter((o) => o.status === "DELIVERED").length,
    },
    period: { revenue: revenue(inRange), orders: inRange.length, aov: inRange.length ? Math.round(inRange.reduce((a, o) => a + o.total, 0) / inRange.length) : 0, newCustomers: customers.filter((c) => new Date(c.createdAt).getTime() >= since).length },
    series: [...byDay].map(([date, v]) => ({ date, ...v })),
    bestSellers: [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
    lowStock: lowStock.slice(0, 20), lowStockCount: lowStock.length,
    recentOrders: orders.slice(-6).reverse().map((o) => ({ id: o.id, number: o.number, total: o.total, status: o.status, createdAt: o.createdAt })),
    recentCustomers: customers.slice(-6).reverse().map((c) => ({ id: c.id, name: c.name, email: c.email, createdAt: c.createdAt })),
  });
}
