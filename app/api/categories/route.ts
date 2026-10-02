import { NextResponse } from "next/server";
import { categories } from "@/lib/data";

export const GET = () => NextResponse.json({ items: categories.filter((c) => c.active) });
