import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export const POST = () => clearSession(NextResponse.json({ ok: true }));
