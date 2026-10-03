import { NextResponse } from "next/server";
import { db, healthCheck, productionWithoutDb } from "@/lib/db";
import { emailProvider } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Public health probe used to verify the production setup. Never exposes connection strings or secrets.
export async function GET() {
  const probe = await healthCheck();
  const ready = probe.ok && !productionWithoutDb();
  return NextResponse.json(
    { ok: ready, database: { backend: db.backend, persistent: db.persistent, readWriteTest: probe.ok, error: probe.error }, email: { provider: emailProvider() }, environment: process.env.NODE_ENV },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
