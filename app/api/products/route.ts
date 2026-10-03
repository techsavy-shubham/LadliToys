import { NextRequest, NextResponse } from "next/server";
import { queryProducts, type SortKey } from "@/lib/data";

const num = (v: string | null) => (v != null && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined);

export function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const result = queryProducts({
    q: s.get("q") || undefined,
    category: s.get("category") || undefined,
    brand: s.get("brand") || undefined,
    age: s.get("age") || undefined,
    minPrice: num(s.get("minPrice")),
    maxPrice: num(s.get("maxPrice")),
    ids: s.get("ids")?.split(",").filter(Boolean),
    minRating: num(s.get("rating")),
    inStock: s.get("inStock") === "true",
    featured: s.get("featured") === "true",
    isNew: s.get("new") === "true",
    sort: (s.get("sort") as SortKey) || undefined,
    page: num(s.get("page")),
    limit: num(s.get("limit")),
  });
  return NextResponse.json(result);
}
