import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth";
import { getAllProducts } from "@/lib/catalog";
import { db } from "@/lib/db";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const [reviews, products] = await Promise.all([db.list<any>("reviews"), getAllProducts(true)]);
  const items = reviews.map(({ userId: _u, ...r }) => ({ ...r, productName: products.find((p) => p.id === r.productId)?.name ?? "Unknown product" })).reverse();
  return NextResponse.json({ items });
}
