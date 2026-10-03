import { createHash, randomBytes } from "node:crypto";
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
import { NextResponse } from "next/server";
import { bad, isEmail, rateLimited, str } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import type { User } from "@/lib/auth";


// The reset link is emailed to the account owner (and recorded in the admin notification log).
// It is only returned in the response when ALLOW_DEV_RESET_LINK=true (local development / demos) - never in production.
export async function POST(req: Request) {
  if (rateLimited(req, "forgot", 5)) return bad("Too many attempts. Try again in a minute.", 429);
  const b = await req.json().catch(() => ({}));
  const email = str(b.email).toLowerCase();
  if (!isEmail(email)) return bad("Please enter a valid email address.");
  const idx = await db.get<{ userId: string }>("emails", email);
  const message = "If an account exists for that email, a reset link has been generated.";
  if (!idx) return NextResponse.json({ message });

  const token = randomBytes(24).toString("hex");
  await db.put("resets", hashToken(token), { userId: idx.userId, exp: Date.now() + 3600_000 });
  const link = `/reset-password?token=${token}`;
  const user = await db.get<User>("users", idx.userId);
  if (user) await notify(user.email, "password_reset", { name: user.name, link });
  return NextResponse.json({ message, ...(process.env.ALLOW_DEV_RESET_LINK === "true" ? { devResetLink: link } : {}) });
}
