import { NextResponse } from "next/server";
import { quote } from "@/lib/pricing";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const { couponDoc: _c, ...q } = await quote(Array.isArray(b.items) ? b.items : [], typeof b.coupon === "string" ? b.coupon : undefined);
  return NextResponse.json(q);
}
