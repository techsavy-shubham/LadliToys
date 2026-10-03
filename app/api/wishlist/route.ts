import { NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllProducts } from "@/lib/catalog";


export async function GET() {
  const u = await getUser();
  if (!u) return unauthorized();
  const w = await db.get<{ ids: string[] }>("wishlists", u.id);
  return NextResponse.json({ ids: w?.ids ?? [] });
}

export async function PUT(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const valid = new Set((await getAllProducts()).map((p) => p.id));
  const ids = Array.isArray(b.ids) ? [...new Set(b.ids.filter((x: unknown) => typeof x === "string" && valid.has(x)))].slice(0, 200) : [];
  await db.put("wishlists", u.id, { ids });
  return NextResponse.json({ ids });
}
