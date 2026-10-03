import { NextRequest, NextResponse } from "next/server";

// CSRF protection for the JSON API: state-changing requests must come from this site.
// (Session cookies are also SameSite=Lax.) The payment webhook is server-to-server and is verified by signature instead.
export function proxy(req: NextRequest) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && !req.nextUrl.pathname.startsWith("/api/payments/webhook")) {
    const origin = req.headers.get("origin");
    if (origin) {
      let ok = false;
      try { ok = new URL(origin).host === req.headers.get("host"); } catch {}
      if (!ok) return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
