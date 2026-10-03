import { NextResponse } from "next/server";
import { bad, getUser, hashPassword, publicUser, str, unauthorized, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const u = await getUser();
  return NextResponse.json({ user: u ? publicUser(u) : null, persistent: db.persistent });
}

export async function PATCH(req: Request) {
  const u = await getUser();
  if (!u) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const next = { ...u };
  if (b.name !== undefined) { next.name = str(b.name, 80); if (next.name.length < 2) return bad("Please enter your name."); }
  if (b.phone !== undefined) {
    next.phone = str(b.phone, 20);
    if (next.phone && !/^[0-9+\-\s]{7,20}$/.test(next.phone)) return bad("Please enter a valid phone number.");
  }
  if (b.newPassword) {
    if (typeof b.currentPassword !== "string" || !verifyPassword(b.currentPassword, u.passwordHash)) return bad("Current password is incorrect.");
    if (String(b.newPassword).length < 8) return bad("New password must be at least 8 characters.");
    next.passwordHash = hashPassword(String(b.newPassword));
  }
  await db.put("users", u.id, next);
  return NextResponse.json({ user: publicUser(next) });
}
