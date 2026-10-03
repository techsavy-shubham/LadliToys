#!/usr/bin/env node
// End-to-end verification of the three production-readiness items:
//   1. persistent database   2. stock updates after an order   3. password-reset email flow
//
// Usage:   node scripts/verify.mjs https://your-site.com
//          VERIFY_EMAIL=you@gmail.com node scripts/verify.mjs https://your-site.com
// VERIFY_EMAIL (optional) is a real inbox you own. The script uses plus-addressing (you+m2123@gmail.com), so the
// reset email genuinely arrives in your inbox. The test order is cancelled at the end, which restores the stock.

const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const stamp = Date.now();
const base = process.env.VERIFY_EMAIL;
const email = base ? base.replace("@", `+m2${stamp}@`) : `verify_${stamp}@example.com`;
const PASSWORD = "Verify-pass-123", NEW_PASSWORD = "Verify-pass-456";

let cookie = "";
const results = [];
const record = (name, pass, detail = "") => { results.push({ name, pass }); console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`); };

async function call(path, method = "GET", body, keepCookie = true) {
  const res = await fetch(BASE + path, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(keepCookie && cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const set = res.headers.getSetCookie?.() ?? [];
  const session = set.map((c) => c.split(";")[0]).find((c) => c.startsWith("ladli_session="));
  if (session) cookie = session.endsWith("=") ? "" : session;
  return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) };
}
const stockOf = async (slug) => (await call(`/api/products/${slug}`)).data.product;

console.log(`\nVerifying ${BASE}\nTest customer: ${email}\n`);

// ---- 1. Persistent database ------------------------------------------------------------------------------------
console.log("1) Persistent database");
const health = await call("/api/health");
const db = health.data.database ?? {};
console.log(`     backend: ${db.backend}, persistent: ${db.persistent}, email provider: ${health.data.email?.provider}`);
record("Health endpoint reachable and read/write test succeeds", health.status !== 0 && db.readWriteTest === true);
record("Database is persistent (MongoDB or PostgreSQL, not memory)", db.persistent === true, db.backend);

// ---- 2. Stock after an order -----------------------------------------------------------------------------------
console.log("\n2) Stock updates after an order");
const reg = await call("/api/auth/register", "POST", { name: "Verify Customer", email, password: PASSWORD });
record("Test customer registered", reg.status === 201, reg.data.error || "");
const addr = await call("/api/addresses", "POST", { name: "Verify Customer", phone: "9999999999", line1: "1 Test Street", city: "Pune", state: "Maharashtra", postalCode: "411001" });
record("Delivery address saved", addr.status === 201, addr.data.error || "");

const SIMPLE = "junior-football-size-3", WITH_VARIANTS = "mega-brick-castle-500pc";
let p = await stockOf(SIMPLE);
const before = p.stock;
const order = await call("/api/orders", "POST", { items: [{ productId: p.id, qty: 2 }], addressId: addr.data.item?.id, paymentMethod: "COD" });
record("Order placed (2 x simple product)", order.status === 201, order.data.error || "");
p = await stockOf(SIMPLE);
record(`Product stock reduced by 2 (${before} -> ${p.stock})`, p.stock === before - 2);

const tooMany = await call("/api/orders", "POST", { items: [{ productId: p.id, qty: p.stock + 5 }], addressId: addr.data.item?.id, paymentMethod: "COD" });
record("Ordering more than the remaining stock is rejected", tooMany.status === 400, tooMany.data.error || "");

let v = await stockOf(WITH_VARIANTS);
const v0 = v.variants[0], vBefore = v0.stock, totalBefore = v.stock;
const vOrder = await call("/api/orders", "POST", { items: [{ productId: v.id, variantId: v0.id, qty: 1 }], addressId: addr.data.item?.id, paymentMethod: "COD" });
record("Order placed (1 x product variant)", vOrder.status === 201, vOrder.data.error || "");
v = await stockOf(WITH_VARIANTS);
record(`Variant stock reduced by 1 (${vBefore} -> ${v.variants[0].stock}) and total updated`, v.variants[0].stock === vBefore - 1 && v.stock === totalBefore - 1);

for (const [o, slug, label, expected] of [[order, SIMPLE, "simple product", before], [vOrder, WITH_VARIANTS, "variant product", totalBefore]]) {
  if (!o.data.order) continue;
  const c = await call(`/api/orders/${o.data.order.id}/cancel`, "POST");
  const after = await stockOf(slug);
  record(`Cancelling the ${label} order restores stock (${after.stock})`, c.ok && after.stock === expected, c.data.error || "");
}

// ---- 3. Password reset email flow ------------------------------------------------------------------------------
console.log("\n3) Password reset email flow");
await call("/api/auth/logout", "POST");
const forgot = await call("/api/auth/forgot", "POST", { email }, false);
record("Reset request accepted", forgot.ok, forgot.data.error || "");
const link = forgot.data.devResetLink;
if (link) {
  console.log("     (ALLOW_DEV_RESET_LINK=true on this server - completing the reset automatically)");
  const token = new URL(link, BASE).searchParams.get("token");
  const reset = await call("/api/auth/reset", "POST", { token, password: NEW_PASSWORD }, false);
  record("Reset link sets a new password", reset.ok, reset.data.error || "");
  const reuse = await call("/api/auth/reset", "POST", { token, password: "Another-pass-789" }, false);
  record("Reset link cannot be used twice", reuse.status === 400);
  const oldLogin = await call("/api/auth/login", "POST", { email, password: PASSWORD }, false);
  record("Old password no longer works", oldLogin.status === 401);
  const newLogin = await call("/api/auth/login", "POST", { email, password: NEW_PASSWORD }, false);
  record("Login works with the new password", newLogin.ok, newLogin.data.error || "");
} else {
  record("Reset link is NOT exposed in the API response (it must arrive by email)", true);
  const provider = health.data.email?.provider;
  record("An email provider is configured", provider === "resend" || provider === "smtp", `provider: ${provider}`);
  console.log(base
    ? `\n     -> Check the inbox of ${base} for "Reset your Ladli Toys password" (sent to ${email}).\n        Open the link, choose a new password, then log in with it.`
    : "\n     -> Re-run with VERIFY_EMAIL=<your real email> to receive the reset email in your own inbox.");
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} checks passed${failed ? ` - ${failed} FAILED` : ""}\n`);
process.exit(failed ? 1 : 0);
