import { NextResponse } from "next/server";
import { bad, getUser, rateLimited, str, unauthorized } from "@/lib/auth";
import { db, newId } from "@/lib/db";
import { findProduct } from "@/lib/catalog";

type Review = { id: string; productId: string; userId: string; name: string; rating: number; body: string; approved: boolean; createdAt: string };
type Ctx = { params: Promise<{ slug: string }> };

async function forProduct(productId: string) {
  return (await db.list<Review>("reviews")).filter((r) => r.productId === productId && r.approved).reverse();
}

export async function GET(_: Request, { params }: Ctx) {
  const p = await findProduct((await params).slug);
  if (!p) return bad("Product not found.", 404);
  const items = (await forProduct(p.id)).map(({ userId: _u, ...r }) => r);
  return NextResponse.json({ items });
}

// Reviews are published immediately; admins can hide or delete them from the moderation screen.
export async function POST(req: Request, { params }: Ctx) {
  if (rateLimited(req, "review", 10)) return bad("Too many requests. Please slow down.", 429);
  const u = await getUser();
  if (!u) return unauthorized();
  const p = await findProduct((await params).slug);
  if (!p) return bad("Product not found.", 404);
  const b = await req.json().catch(() => ({}));
  const rating = Math.round(Number(b.rating));
  const body = str(b.body, 1000);
  if (!(rating >= 1 && rating <= 5)) return bad("Please choose a star rating.");
  if (body.length < 5) return bad("Please write a short review (at least 5 characters).");
  if ((await forProduct(p.id)).some((r) => r.userId === u.id)) return bad("You have already reviewed this toy.", 409);
  const r: Review = { id: newId("r"), productId: p.id, userId: u.id, name: u.name.split(" ")[0] + (u.name.split(" ")[1] ? ` ${u.name.split(" ")[1][0]}.` : ""), rating, body, approved: true, createdAt: new Date().toISOString() };
  await db.put("reviews", r.id, r);
  const { userId: _u, ...pub } = r;
  return NextResponse.json({ item: pub }, { status: 201 });
}
