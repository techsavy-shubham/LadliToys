import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db, newId, type Doc } from "./db";

export type User = { id: string; name: string; email: string; phone: string; passwordHash: string; role: "CUSTOMER" | "ADMIN"; active: boolean; createdAt: string };
export const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt });

export const newUserDoc = (u: Pick<User, "name" | "email" | "phone" | "passwordHash">): User => ({
  id: newId("u"), ...u, role: "CUSTOMER", active: true, createdAt: new Date().toISOString(),
});

const COOKIE ="ladli_session";
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set");
  return s || "dev-only-secret-change-me";
};

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

const sign = (p: string) => createHmac("sha256", secret()).update(p).digest("base64url");
export function makeToken(uid: string, days = 7) {
  const p = Buffer.from(JSON.stringify({ uid, exp: Date.now() + days * 864e5 })).toString("base64url");
  return `${p}.${sign(p)}`;
}
function readToken(t?: string) {
  if (!t) return null;
  const [p, s] = t.split(".");
  if (!p || !s || sign(p) !== s) return null;
  try {
    const d = JSON.parse(Buffer.from(p, "base64url").toString());
    return d.exp > Date.now() ? (d.uid as string) : null;
  } catch { return null; }
}

export async function getUser(): Promise<User | null> {
  const uid = readToken((await cookies()).get(COOKIE)?.value);
  if (!uid) return null;
  const u = await db.get<User>("users", uid);
  return u && u.active ? u : null;
}

export function withSession(res: NextResponse, uid: string) {
  res.cookies.set(COOKIE, makeToken(uid), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return res;
}
export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export const unauthorized = () => NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Simple in-memory rate limiter (per instance) for auth endpoints.
const hits: Map<string, number[]> = ((globalThis as any).__ladliHits ??= new Map());
export function rateLimited(req: Request, key: string, max = 10, windowMs = 60_000) {
  if (process.env.DISABLE_RATE_LIMIT === "true") return false; // automated tests only - never set in production
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(k) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(k, recent);
  return recent.length > max;
}

export const isEmail = (s: unknown): s is string => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;
export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export type { Doc };

export async function requireAdmin(): Promise<User | null> {
  const u = await getUser();
  return u && u.role === "ADMIN" ? u : null;
}

// The store owner's admin account is created from ADMIN_EMAIL / ADMIN_PASSWORD on first login.
export async function ensureAdmin(email: string, password: string) {
  const ae = (process.env.ADMIN_EMAIL || "").toLowerCase();
  if (!ae || email !== ae || !process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return;
  if (await db.get("emails", email)) return;
  const user: User = { ...newUserDoc({ name: "Store Admin", email, phone: "", passwordHash: hashPassword(password) }), role: "ADMIN" };
  await db.put("users", user.id, user);
  await db.put("emails", email, { userId: user.id });
}
