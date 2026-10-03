import { NextResponse } from "next/server";
import { bad, isEmail, rateLimited, str } from "@/lib/auth";
import { db, newId } from "@/lib/db";

export async function POST(req: Request) {
  if (rateLimited(req, "newsletter", 5)) return bad("Too many attempts. Try again in a minute.", 429);
  const email = str((await req.json().catch(() => ({}))).email).toLowerCase();
  if (!isEmail(email)) return bad("Please enter a valid email address.");
  if (!(await db.get("subscribers", email))) await db.put("subscribers", email, { id: newId("s"), email, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
