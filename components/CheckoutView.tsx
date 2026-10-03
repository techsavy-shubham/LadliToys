"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, useStore } from "@/lib/client-state";
import { formatPrice } from "@/lib/data";
import { Addresses, RequireLogin } from "./AccountView";
import { Err } from "./AuthForm";
import { useCoupon, useQuote } from "./CartView";
import { startPayment } from "@/lib/pay-client";
import ProductImage from "./ProductImage";
import { Totals } from "./OrdersView";

export default function CheckoutView() {
  const { cart, clearCart } = useStore();
  const router = useRouter();
  const [coupon] = useCoupon();
  const q = useQuote(coupon);
  const [addressId, setAddressId] = useState("");
  const [pay, setPay] = useState("COD");
  const [online, setOnline] = useState(false);
  useEffect(() => { api("/api/config").then((r) => setOnline(!!r.data.onlinePayments)); }, []);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function place() {
    setErr(""); setBusy(true);
    if (pay === "ONLINE") {
      const e = await startPayment({ items: cart, coupon: q?.coupon?.code, addressId }, () => { clearCart(); try { sessionStorage.removeItem("ladli_coupon"); } catch {} }, (p) => router.push(p));
      if (e) { setErr(e); setBusy(false); }
      return;
    }
    const r = await api("/api/orders", "POST", { items: cart, coupon: q?.coupon?.code, addressId, paymentMethod: pay });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Could not place order.");
    clearCart(); try { sessionStorage.removeItem("ladli_coupon"); } catch {}
    router.push(`/orders/${r.data.order.id}?placed=1`);
  }

  if (cart.length === 0) return (
    <div className="container-x py-20 text-center"><h1 className="text-2xl font-extrabold">Your cart is empty</h1><Link href="/products" className="btn btn-primary mt-5">Browse toys</Link></div>
  );
  const blocked = !q || q.lines.some((l) => l.issue) || !addressId || busy;

  return (
    <RequireLogin>
      <div className="container-x py-8">
        <h1 className="mb-5 text-3xl font-extrabold">Checkout</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5"><h2 className="mb-4 text-xl font-extrabold">1. Delivery address</h2><Addresses onPick={setAddressId} selected={addressId} /></section>
            <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <h2 className="mb-4 text-xl font-extrabold">2. Payment method</h2>
              <div className="space-y-2 text-sm">
                <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 ${pay === "COD" ? "border-brand bg-brand/5" : "border-ink/10"}`}>
                  <input type="radio" checked={pay === "COD"} onChange={() => setPay("COD")} /><span><strong>Cash on Delivery</strong><br />Pay when your order arrives.</span>
                </label>
                {online && <label className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 ${pay === "ONLINE" ? "border-brand bg-brand/5" : "border-ink/10"}`}>
                  <input type="radio" checked={pay === "ONLINE"} onChange={() => setPay("ONLINE")} /><span><strong>Pay online</strong><br />Card, UPI or net banking via secure checkout. Card details never touch our servers.</span>
                </label>}
              </div>
            </section>
            <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <h2 className="mb-4 text-xl font-extrabold">3. Review items</h2>
              <ul className="space-y-3">
                {q?.lines.map((l) => (
                  <li key={l.productId + l.variantId} className="flex items-center gap-3 text-sm">
                    <ProductImage emoji={l.emoji} colors={l.colors} src={l.image} className="h-14 w-14 rounded-xl [&>span]:!text-2xl" />
                    <div className="flex-1"><div className="font-bold">{l.name}</div><div className="text-ink/60">{l.variantLabel && `${l.variantLabel} · `}Qty {l.qty}</div>{l.issue && <div className="font-semibold text-red-600">{l.issue} — <Link href="/cart" className="underline">update cart</Link></div>}</div>
                    <div className="font-bold">{formatPrice(l.lineTotal)}</div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="h-fit space-y-4">
            {q && <Totals q={{ ...q, couponCode: q.coupon?.code }} />}
            <Err m={err} />
            <button disabled={blocked} onClick={place} className="btn btn-primary w-full py-3 disabled:opacity-40">{busy ? "Please wait…" : pay === "ONLINE" ? `Pay ${q ? formatPrice(q.total) : ""}` : `Place order${q ? ` · ${formatPrice(q.total)}` : ""}`}</button>
            {!addressId && <p className="text-xs text-ink/60">Choose or add a delivery address to continue.</p>}
            <Link href="/cart" className="block text-center text-sm font-bold text-brand">← Back to cart</Link>
          </aside>
        </div>
      </div>
    </RequireLogin>
  );
}
