"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { finalPrice, formatPrice, type Product } from "@/lib/data";
import { useStore } from "@/lib/client-state";
import { WishlistHeart } from "./CardActions";

export default function ProductPurchase({ product: p }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useStore();
  const [vid, setVid] = useState(p.variants.find((x) => x.stock > 0)?.id ?? p.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const v = p.variants.find((x) => x.id === vid);
  const basePrice = v ? v.price : p.price;
  const price = finalPrice({ price: basePrice, discountPercent: p.discountPercent });
  const stock = v ? v.stock : p.stock;
  const out = stock === 0;
  const add = () => addToCart({ productId: p.id, variantId: v?.id, qty });

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-extrabold text-brand">{formatPrice(price)}</span>
        {p.discountPercent > 0 && (
          <>
            <span className="text-lg text-ink/40 line-through">{formatPrice(basePrice)}</span>
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-sm font-extrabold text-brand">Save {p.discountPercent}%</span>
          </>
        )}
      </div>

      {p.variants.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-bold">Option: <span className="font-normal">{v?.label}</span></div>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((x) => (
              <button key={x.id} onClick={() => { setVid(x.id); setQty(1); }} disabled={x.stock === 0}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition disabled:opacity-40 ${x.id === vid ? "border-brand bg-brand/10 text-brand" : "border-ink/10 hover:border-brand"}`}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`text-sm font-bold ${out ? "text-red-500" : stock < 10 ? "text-amber-600" : "text-emerald-600"}`}>
        {out ? "Out of stock" : stock < 10 ? `Only ${stock} left in stock` : "In stock"}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border-2 border-ink/10 bg-white">
          <button aria-label="Decrease quantity" className="h-11 w-11 text-xl font-bold" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-8 text-center font-bold">{qty}</span>
          <button aria-label="Increase quantity" className="h-11 w-11 text-xl font-bold" onClick={() => setQty((q) => Math.min(Math.min(stock, 20) || 1, q + 1))}>+</button>
        </div>
        <button disabled={out} className="btn btn-primary flex-1 py-3 disabled:opacity-40 sm:flex-none sm:px-10"
          onClick={() => { add(); setAdded(true); setTimeout(() => setAdded(false), 2000); }}>
          {added ? "Added ✓" : "Add to cart"}
        </button>
        <button disabled={out} className="btn btn-ghost py-3 disabled:opacity-40" onClick={() => { add(); router.push("/checkout"); }}>Buy now</button>
        <WishlistHeart productId={p.id} className="!h-11 !w-11 ring-2 ring-ink/10" />
      </div>
      {added && <Link href="/cart" className="inline-block text-sm font-bold text-brand hover:underline">View cart →</Link>}
    </div>
  );
}
