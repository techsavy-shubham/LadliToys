import { NextResponse } from "next/server";
import { bad, publicUser, requireAdmin, unauthorized, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { listOrders } from "@/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const u = await db.get<User>("users", (await params).id);
  if (!u) return bad("Not found.", 404);
  const orders = (await listOrders()).filter((o) => o.userId === u.id).reverse();
  return NextResponse.json({ customer: { ...publicUser(u), active: u.active }, orders });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  const u = await db.get<User>("users", (await params).id);
  if (!u || u.role === "ADMIN") return bad("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  if (typeof b.active === "boolean") await db.put("users", u.id, { ...u, active: b.active });
  return NextResponse.json({ ok: true });
}
