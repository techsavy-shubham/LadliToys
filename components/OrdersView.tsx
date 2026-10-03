"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startPayment } from "@/lib/pay-client";
import { api, useStore } from "@/lib/client-state";
import { formatPrice } from "@/lib/data";
import ProductImage from "./ProductImage";
import { RequireLogin } from "./AccountView";

type Order = any;
const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export function OrderList() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { api("/api/orders").then((r) => setOrders(r.data.items ?? [])); }, []);
  return (
    <RequireLogin>
      <div className="container-x py-8">
        <h1 className="mb-5 text-3xl font-extrabold">My Orders</h1>
        {!orders ? <p className="text-ink/60">Loading…</p> : orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-ink/5"><div className="text-5xl">📦</div><p className="mt-3 font-bold">No orders yet.</p><Link href="/products" className="btn btn-primary mt-4">Start shopping</Link></div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 ring-1 ring-ink/5 hover:ring-brand">
                <div><div className="font-extrabold">#{o.number}</div><div className="text-sm text-ink/60">{new Date(o.createdAt).toLocaleDateString("en-IN")} · {o.items.length} item(s)</div></div>
                <div className="flex gap-1">{o.items.slice(0, 3).map((i: any, n: number) => <ProductImage key={n} emoji={i.emoji} colors={i.colors} src={i.image} className="h-12 w-12 rounded-xl [&>span]:!text-2xl" />)}</div>
                <div className="text-right"><div className="font-extrabold text-brand">{formatPrice(o.total)}</div><span className="rounded-full bg-sun/30 px-2.5 py-0.5 text-xs font-bold">{label(o.status)}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RequireLogin>
  );
}

const FLOW = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

function Timeline({ o }: { o: Order }) {
  const closed = o.status === "CANCELLED" || o.status === "REFUNDED";
  const reached = new Set<string>(o.history.map((h: any) => h.status));
  const idx = FLOW.indexOf(o.status);
  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
      <h3 className="mb-4 font-extrabold">Order tracking</h3>
      {o.status === "PENDING_PAYMENT" && <p className="mb-3 rounded-xl bg-sun/20 px-3 py-2 text-sm font-semibold">Awaiting payment — your order will be confirmed once payment is received.</p>}
      <ol className="grid gap-3 sm:grid-cols-6">
        {FLOW.map((s, i) => {
          const done = !closed && (i <= idx || (reached.has(s) && idx >= 0));
          const at = o.history.find((h: any) => h.status === s)?.at;
          return (
            <li key={s} className="flex items-center gap-3 sm:flex-col sm:text-center">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${done ? "bg-emerald-500 text-white" : "bg-ink/10 text-ink/40"}`}>{done ? "✓" : i + 1}</span>
              <span className="text-xs"><span className={`block font-bold ${done ? "" : "text-ink/40"}`}>{label(s)}</span>{done && at && <span className="text-ink/50">{new Date(at).toLocaleDateString("en-IN")}</span>}</span>
            </li>
          );
        })}
      </ol>
      {closed && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">This order was {o.status === "REFUNDED" ? "refunded" : "cancelled"}.{o.refundedAmount ? ` Refunded: ${formatPrice(o.refundedAmount)}.` : ""}</p>}
      {o.tracking?.number && (
        <p className="mt-4 text-sm"><strong>Shipment:</strong> {o.tracking.carrier} · {o.tracking.number}{o.tracking.url && <> · <a href={o.tracking.url} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline">Track package</a></>}</p>
      )}
      <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-brand">Activity log</summary>
        <ul className="mt-2 space-y-1 text-ink/70">{[...o.history].reverse().map((h: any, n: number) => <li key={n}>{new Date(h.at).toLocaleString("en-IN")} — {label(h.status)}{h.note ? ` (${h.note})` : ""}</li>)}</ul>
      </details>
    </div>
  );
}

function PayNow({ o }: { o: Order }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  if (o.paymentMethod !== "ONLINE" || o.paymentStatus === "PAID" || ["CANCELLED", "REFUNDED"].includes(o.status)) return null;
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
      <p className="mb-3 text-sm font-semibold">{o.paymentStatus === "PENDING" ? "Payment is pending." : `Payment ${label(o.paymentStatus).toLowerCase()}.`} Complete it to confirm your order.</p>
      <button disabled={busy} className="btn btn-primary" onClick={async () => { setBusy(true); setErr(""); const e = await startPayment({ orderId: o.id }, () => {}, (p) => router.push(p)); if (e) { setErr(e); setBusy(false); } }}>{busy ? "Please wait…" : `Pay ${formatPrice(o.total)}`}</button>
      {err && <p className="mt-2 text-sm font-semibold text-red-600">{err}</p>}
    </div>
  );
}

export function OrderDetail({ id, fresh }: { id: string; fresh?: boolean }) {
  const [o, setO] = useState<Order | null | undefined>(undefined);
  useStore();
  useEffect(() => { api(`/api/orders/${id}`).then((r) => setO(r.ok ? r.data.order : null)); }, [id]);
  const paid = o && o.paymentStatus === "PAID";
  return (
    <RequireLogin>
      <div className="container-x py-8">
        {o === undefined ? <p className="text-ink/60">Loading…</p> : o === null ? (
          <div className="py-16 text-center"><p className="font-bold">Order not found.</p><Link href="/account/orders" className="btn btn-primary mt-4">My orders</Link></div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {fresh && (paid || o.paymentMethod === "COD") && (
              <div className="rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
                <div className="text-5xl">🎉</div><h1 className="mt-2 text-2xl font-extrabold text-emerald-800">Thank you! Your order is placed.</h1>
                <p className="text-sm text-emerald-700">We&apos;ve received order #{o.number}. We&apos;ll keep you posted by email as it moves along.</p>
              </div>
            )}
            {fresh && !paid && o.paymentMethod === "ONLINE" && (
              <div className="rounded-3xl bg-red-50 p-6 text-center ring-1 ring-red-200"><h1 className="text-xl font-extrabold text-red-800">Payment {o.paymentStatus === "CANCELLED" ? "cancelled" : "not completed"}</h1><p className="text-sm text-red-700">No money was taken. You can retry below.</p></div>
            )}
            <PayNow o={o} />
            <Timeline o={o} />
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-extrabold">Order #{o.number}</h2><span className="rounded-full bg-sun/30 px-3 py-1 text-sm font-bold">{label(o.status)}</span></div>
              <p className="text-sm text-ink/60">Placed on {new Date(o.createdAt).toLocaleString("en-IN")} · Payment: {o.paymentMethod === "COD" ? "Cash on Delivery" : "Online"} ({label(o.paymentStatus)})</p>
              <ul className="mt-4 divide-y divide-ink/5">
                {o.items.map((i: any, n: number) => (
                  <li key={n} className="flex items-center gap-3 py-3">
                    <ProductImage emoji={i.emoji} colors={i.colors} src={i.image} className="h-16 w-16 rounded-2xl [&>span]:!text-3xl" />
                    <div className="flex-1 text-sm"><Link href={`/products/${i.slug}`} className="font-bold hover:text-brand">{i.name}</Link>{i.variantLabel && <div className="text-ink/60">{i.variantLabel}</div>}<div className="text-ink/60">Qty {i.qty} × {formatPrice(i.unitPrice)}</div></div>
                    <div className="font-bold">{formatPrice(i.unitPrice * i.qty)}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 text-sm ring-1 ring-ink/5"><h3 className="mb-2 font-extrabold">Delivery address</h3>{o.address.name}<br />{o.address.line1}{o.address.line2 && `, ${o.address.line2}`}<br />{o.address.city}, {o.address.state} {o.address.postalCode}<br />{o.address.country}<br />📞 {o.address.phone}</div>
              <Totals q={o} />
            </div>
            <Link href="/account/orders" className="font-bold text-brand">← All orders</Link>
          </div>
        )}
      </div>
    </RequireLogin>
  );
}

export function Totals({ q }: { q: { itemsTotal: number; discount: number; shipping: number; tax: number; total: number; couponCode?: string } }) {
  const row = (l: string, v: string, cls = "") => <div className={`flex justify-between ${cls}`}><span>{l}</span><span>{v}</span></div>;
  return (
    <div className="space-y-2 rounded-3xl bg-white p-6 text-sm ring-1 ring-ink/5">
      <h3 className="mb-2 font-extrabold">Order summary</h3>
      {row("Subtotal", formatPrice(q.itemsTotal))}
      {q.discount > 0 && row(`Coupon${q.couponCode ? ` (${q.couponCode})` : ""}`, `−${formatPrice(q.discount)}`, "text-emerald-700")}
      {row("Shipping", q.shipping === 0 ? "FREE" : formatPrice(q.shipping))}
      {row("Tax (5% GST)", formatPrice(q.tax))}
      <div className="border-t border-ink/10 pt-2">{row("Total", formatPrice(q.total), "text-lg font-extrabold")}</div>
    </div>
  );
}
