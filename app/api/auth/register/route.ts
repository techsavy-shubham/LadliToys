import { NextResponse } from "next/server";
import { bad, hashPassword, isEmail, newUserDoc, publicUser, rateLimited, str, withSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  if (rateLimited(req, "register", 10)) return bad("Too many attempts. Try again in a minute.", 429);
  const b = await req.json().catch(() => ({}));
  const name = str(b.name, 80), email = str(b.email).toLowerCase(), phone = str(b.phone, 20), password = typeof b.password === "string" ? b.password : "";
  if (name.length < 2) return bad("Please enter your name.");
  if (!isEmail(email)) return bad("Please enter a valid email address.");
  if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) return bad("Please enter a valid phone number.");
  if (password.length < 8 || password.length > 100) return bad("Password must be at least 8 characters.");
  if (email === (process.env.ADMIN_EMAIL || "").toLowerCase() || (await db.get("emails", email))) return bad("An account with this email already exists.", 409);

  const user = newUserDoc({ name, email, phone, passwordHash: hashPassword(password) });
  await db.put("users", user.id, user);
  await db.put("emails", email, { userId: user.id });
  await notify(email, "registered", { name });
  return withSession(NextResponse.json({ user: publicUser(user) }, { status: 201 }), user.id);
}
