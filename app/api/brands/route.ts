import { NextResponse } from "next/server";
import { getBrands } from "@/lib/catalog";

export const GET = async () => NextResponse.json({ items: await getBrands() });
