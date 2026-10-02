"use client";
import { useState } from "react";
import { formatPrice, type Product, finalPrice } from "@/lib/data";

// Variant + quantity selection. Cart/wishlist persistence arrives in Milestone 2.
export default function ProductPurchase({ product: p }: { product: Product }) {
  const [vid, setVid] = useState(p.variants[0]?.id);
  const [qty, setQty] = useState(1);
  const v = p.variants.find((x) => x.id === vid);
  const basePrice = v ? v.price : p.price;
  const price = finalPrice({ price: basePrice, discountPercent: p.discountPercent });
  const stock = v ? v.stock : p.stock;
  const out = stock === 0;

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
          <button aria-label="Increase quantity" className="h-11 w-11 text-xl font-bold" onClick={() => setQty((q) => Math.min(stock || 1, q + 1))}>+</button>
        </div>
        <button disabled={out} className="btn btn-primary flex-1 py-3 disabled:opacity-40 sm:flex-none sm:px-10"
          onClick={() => alert("Cart & checkout arrive in Milestone 2.")}>
          Add to cart
        </button>
        <button disabled={out} className="btn btn-ghost py-3 disabled:opacity-40" onClick={() => alert("Checkout arrives in Milestone 2.")}>Buy now</button>
      </div>
    </div>
  );
}
