import { NextResponse } from "next/server";
import { bad, publicUser, rateLimited, str, verifyPassword, withSession, type User } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  if (rateLimited(req, "login", 10)) return bad("Too many attempts. Try again in a minute.", 429);
  const b = await req.json().catch(() => ({}));
  const email = str(b.email).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const idx = await db.get<{ userId: string }>("emails", email);
  const user = idx ? await db.get<User>("users", idx.userId) : null;
  if (!user || !verifyPassword(password, user.passwordHash)) return bad("Incorrect email or password.", 401);
  if (!user.active) return bad("This account has been deactivated.", 403);
  return withSession(NextResponse.json({ user: publicUser(user) }), user.id);
}
