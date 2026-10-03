import { NextResponse } from "next/server";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Order } from "../route";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser();
  if (!u) return unauthorized();
  const o = await db.get<Order>("orders", (await params).id);
  if (!o || o.userId !== u.id) return bad("Order not found.", 404);
  return NextResponse.json({ order: o });
}
