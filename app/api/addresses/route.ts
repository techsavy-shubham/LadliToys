import { NextResponse } from "next/server";
import { mine, parseAddress, type Address } from "@/lib/addresses";
import { bad, getUser, rateLimited, unauthorized } from "@/lib/auth";
import { db, newId } from "@/lib/db";


export async function GET() {
  const u = await getUser();
  if (!u) return unauthorized();
  return NextResponse.json({ items: await mine(u.id) });
}

export async function POST(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  if (rateLimited(req, "address", 30)) return bad("Too many requests. Please slow down.", 429);
  const body = await req.json().catch(() => ({}));
  const { value, error } = parseAddress(body);
  if (!value) return bad(error!);
  const existing = await mine(u.id);
  if (existing.length >= 10) return bad("You can save up to 10 addresses.");
  const isDefault = existing.length === 0 || body.isDefault === true;
  if (isDefault) for (const a of existing.filter((a) => a.isDefault)) await db.put("addresses", a.id, { ...a, isDefault: false });
  const addr: Address = { id: newId("a"), userId: u.id, ...value, isDefault };
  await db.put("addresses", addr.id, addr);
  return NextResponse.json({ item: addr }, { status: 201 });
}
