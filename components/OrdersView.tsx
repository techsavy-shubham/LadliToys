"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
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
                <div className="flex gap-1">{o.items.slice(0, 3).map((i: any, n: number) => <ProductImage key={n} emoji={i.emoji} colors={i.colors} className="h-12 w-12 rounded-xl [&>span]:!text-2xl" />)}</div>
                <div className="text-right"><div className="font-extrabold text-brand">{formatPrice(o.total)}</div><span className="rounded-full bg-sun/30 px-2.5 py-0.5 text-xs font-bold">{label(o.status)}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RequireLogin>
  );
}

export function OrderDetail({ id, fresh }: { id: string; fresh?: boolean }) {
  const [o, setO] = useState<Order | null | undefined>(undefined);
  useStore();
  useEffect(() => { api(`/api/orders/${id}`).then((r) => setO(r.ok ? r.data.order : null)); }, [id]);
  return (
    <RequireLogin>
      <div className="container-x py-8">
        {o === undefined ? <p className="text-ink/60">Loading…</p> : o === null ? (
          <div className="py-16 text-center"><p className="font-bold">Order not found.</p><Link href="/account/orders" className="btn btn-primary mt-4">My orders</Link></div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {fresh && (
              <div className="rounded-3xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
                <div className="text-5xl">🎉</div><h1 className="mt-2 text-2xl font-extrabold text-emerald-800">Thank you! Your order is placed.</h1>
                <p className="text-sm text-emerald-700">We&apos;ve received order #{o.number}. A confirmation email will be sent once notifications are enabled.</p>
              </div>
            )}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-extrabold">Order #{o.number}</h2><span className="rounded-full bg-sun/30 px-3 py-1 text-sm font-bold">{label(o.status)}</span></div>
              <p className="text-sm text-ink/60">Placed on {new Date(o.createdAt).toLocaleString("en-IN")} · Payment: {o.paymentMethod === "COD" ? "Cash on Delivery" : o.paymentMethod} ({label(o.paymentStatus)})</p>
              <ul className="mt-4 divide-y divide-ink/5">
                {o.items.map((i: any, n: number) => (
                  <li key={n} className="flex items-center gap-3 py-3">
                    <ProductImage emoji={i.emoji} colors={i.colors} className="h-16 w-16 rounded-2xl [&>span]:!text-3xl" />
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
