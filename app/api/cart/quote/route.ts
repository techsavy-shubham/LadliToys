import { NextResponse } from "next/server";
import { quote } from "@/lib/pricing";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const items = Array.isArray(b.items) ? b.items : [];
  return NextResponse.json(quote(items, typeof b.coupon === "string" ? b.coupon : undefined));
}
