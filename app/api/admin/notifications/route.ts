import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/notify";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  const items = (await db.list<any>("notifications")).reverse().slice(0, 100);
  return NextResponse.json({ items, emailConfigured: emailConfigured() });
}
