import { NextResponse } from "next/server";
import { getBanners } from "@/lib/catalog";

export const GET = async () => NextResponse.json({ items: await getBanners() });
