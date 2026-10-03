import { NextResponse } from "next/server";
import { findProduct, relatedTo } from "@/lib/catalog";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product, related: await relatedTo(product) });
}
