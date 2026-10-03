"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useStore } from "@/lib/client-state";
import { formatPrice } from "@/lib/data";
import ProductImage from "./ProductImage";
import { Totals } from "./OrdersView";

export type Quote = {
  lines: { productId: string; variantId?: string; slug: string; name: string; variantLabel?: string; emoji: string; colors: [string, string]; listPrice: number; unitPrice: number; qty: number; stock: number; lineTotal: number; issue?: string }[];
  itemsTotal: number; savings: number; discount: number; coupon: { code: string; label: string } | null; couponError?: string; shipping: number; tax: number; total: number; count: number;
};

export function useQuote(coupon: string) {
  const { cart } = useStore();
  const [q, setQ] = useState<Quote | null>(null);
  const key = JSON.stringify(cart);
  useEffect(() => {
    if (cart.length === 0) { setQ(null); return; }
    let live = true;
    api<Quote>("/api/cart/quote", "POST", { items: cart, coupon }).then((r) => live && setQ(r.data));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, coupon]);
  return cart.length === 0 ? null : q;
}

export function useCoupon() {
  const [coupon, setCoupon] = useState("");
  useEffect(() => { try { setCoupon(sessionStorage.getItem("ladli_coupon") || ""); } catch {} }, []);
  const set = (c: string) => { setCoupon(c); try { sessionStorage.setItem("ladli_coupon", c); } catch {} };
  return [coupon, set] as const;
}

export default function CartView() {
  const { cart, setQty, removeFromCart } = useStore();
  const [coupon, setCoupon] = useCoupon();
  const [input, setInput] = useState("");
  const q = useQuote(coupon);

  if (cart.length === 0) return (
    <div className="container-x py-20 text-center"><div className="text-6xl">🛒</div><h1 className="mt-3 text-2xl font-extrabold">Your cart is empty</h1>
      <Link href="/products" className="btn btn-primary mt-5">Browse toys</Link></div>
  );
  const blocked = !q || q.lines.some((l) => l.issue);

  return (
    <div className="container-x py-8">
      <h1 className="mb-5 text-3xl font-extrabold">Shopping Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {(q?.lines ?? []).map((l) => (
            <li key={l.productId + l.variantId} className="flex gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5">
              <Link href={`/products/${l.slug}`} className="w-24 shrink-0"><ProductImage emoji={l.emoji} colors={l.colors} className="rounded-2xl [&>span]:!text-4xl" /></Link>
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <Link href={`/products/${l.slug}`} className="font-bold hover:text-brand">{l.name}</Link>
                {l.variantLabel && <span className="text-ink/60">Option: {l.variantLabel}</span>}
                <span className="font-bold text-brand">{formatPrice(l.unitPrice)} {l.listPrice > l.unitPrice && <s className="font-normal text-ink/40">{formatPrice(l.listPrice)}</s>}</span>
                {l.issue && <span className="font-semibold text-red-600">{l.issue}{l.stock > 0 ? " — quantity adjusted" : ""}</span>}
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-full border-2 border-ink/10">
                    <button aria-label="Decrease quantity" className="h-8 w-8 font-bold" onClick={() => setQty(l.productId, l.variantId, l.qty - 1)}>−</button>
                    <span className="w-7 text-center font-bold">{l.qty}</span>
                    <button aria-label="Increase quantity" className="h-8 w-8 font-bold" disabled={l.qty >= l.stock} onClick={() => setQty(l.productId, l.variantId, l.qty + 1)}>+</button>
                  </div>
                  <button className="text-xs font-bold text-ink/50 hover:text-brand" onClick={() => removeFromCart(l.productId, l.variantId)}>Remove</button>
                  <span className="ml-auto font-extrabold">{formatPrice(l.lineTotal)}</span>
                </div>
              </div>
            </li>
          ))}
          {!q && <li className="text-ink/60">Calculating…</li>}
        </ul>

        <aside className="h-fit space-y-4">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
            <h3 className="mb-2 font-extrabold">Have a coupon?</h3>
            {q?.coupon ? (
              <p className="text-sm"><strong>{q.coupon.code}</strong> applied — {q.coupon.label} <button className="ml-2 font-bold text-brand" onClick={() => setCoupon("")}>Remove</button></p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setCoupon(input); }} className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Try WELCOME10" aria-label="Coupon code" className="min-w-0 flex-1 rounded-full border-2 border-ink/10 px-4 py-2 text-sm uppercase outline-none focus:border-brand" />
                <button className="btn btn-ghost !py-2">Apply</button>
              </form>
            )}
            {q?.couponError && <p className="mt-2 text-sm font-semibold text-red-600">{q.couponError}</p>}
          </div>
          {q && <Totals q={{ ...q, couponCode: q.coupon?.code }} />}
          {q && q.shipping > 0 && <p className="text-xs text-ink/60">Add {formatPrice(999 - (q.itemsTotal - q.discount))} more for free shipping.</p>}
          <Link href={blocked ? "#" : "/checkout"} aria-disabled={blocked} className={`btn btn-primary w-full py-3 ${blocked ? "pointer-events-none opacity-40" : ""}`}>Proceed to checkout</Link>
          <Link href="/products" className="block text-center text-sm font-bold text-brand">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
