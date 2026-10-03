import { NextResponse } from "next/server";
import { getCategories } from "@/lib/catalog";

export const GET = async () => NextResponse.json({ items: await getCategories() });
