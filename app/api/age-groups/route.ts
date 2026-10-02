import { NextResponse } from "next/server";
import { ageGroups } from "@/lib/data";

export const GET = () => NextResponse.json({ items: ageGroups });
