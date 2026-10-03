import { NextResponse } from "next/server";
import { mine, parseAddress, type Address } from "@/lib/addresses";
import { bad, getUser, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string) {
  const u = await getUser();
  if (!u) return { u: null, a: null };
  const a = await db.get<Address>("addresses", id);
  return { u, a: a && a.userId === u.id ? a : null };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { u, a } = await owned((await params).id);
  if (!u) return unauthorized();
  if (!a) return bad("Address not found.", 404);
  const body = await req.json().catch(() => ({}));
  let next: Address = { ...a };
  if (Object.keys(body).some((k) => k !== "isDefault")) {
    const { value, error } = parseAddress({ ...a, ...body });
    if (!value) return bad(error!);
    next = { ...a, ...value };
  }
  if (body.isDefault === true) {
    for (const o of (await mine(u.id)).filter((o) => o.isDefault && o.id !== a.id)) await db.put("addresses", o.id, { ...o, isDefault: false });
    next.isDefault = true;
  }
  await db.put("addresses", a.id, next);
  return NextResponse.json({ item: next });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { u, a } = await owned((await params).id);
  if (!u) return unauthorized();
  if (!a) return bad("Address not found.", 404);
  await db.del("addresses", a.id);
  if (a.isDefault) {
    const rest = await mine(u.id);
    if (rest[0]) await db.put("addresses", rest[0].id, { ...rest[0], isDefault: true });
  }
  return NextResponse.json({ ok: true });
}
