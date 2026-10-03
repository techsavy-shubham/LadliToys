import { NextResponse } from "next/server";
import { bad, hashPassword, rateLimited, type User } from "@/lib/auth";
import { db } from "@/lib/db";
import { createHash } from "node:crypto";

export async function POST(req: Request) {
  if (rateLimited(req, "reset", 10)) return bad("Too many attempts. Try again in a minute.", 429);
  const b = await req.json().catch(() => ({}));
  const token = typeof b.token === "string" ? b.token : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (password.length < 8 || password.length > 100) return bad("Password must be at least 8 characters.");
  const key = createHash("sha256").update(token).digest("hex");
  const rec = await db.get<{ userId: string; exp: number }>("resets", key);
  if (!rec || rec.exp < Date.now()) return bad("This reset link is invalid or has expired.", 400);
  const user = await db.get<User>("users", rec.userId);
  if (!user) return bad("Account not found.", 404);
  await db.put("users", user.id, { ...user, passwordHash: hashPassword(password) });
  await db.del("resets", key);
  return NextResponse.json({ ok: true });
}
