import { NextResponse } from "next/server";
import { banners } from "@/lib/data";

export const GET = () => NextResponse.json({ items: banners });
