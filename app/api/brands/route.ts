import { NextResponse } from "next/server";
import { brands } from "@/lib/data";

export const GET = () => NextResponse.json({ items: brands });
