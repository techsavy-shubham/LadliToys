import { NextResponse } from "next/server";
import { bad, requireAdmin, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const r = await db.get<any>("reviews", (await params).id);
  if (!r) return bad("Not found.", 404);
  const b = await req.json().catch(() => ({}));
  await db.put("reviews", r.id, { ...r, approved: b.approved === true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await db.del("reviews", (await params).id);
  return NextResponse.json({ ok: true });
}
