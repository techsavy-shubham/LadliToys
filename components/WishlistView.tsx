"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useStore } from "@/lib/client-state";
import { finalPrice, formatPrice, type Product } from "@/lib/data";
import ProductImage from "./ProductImage";

export default function WishlistView() {
  const { wishlist, removeFromWishlist, addToCart } = useStore();
  const [items, setItems] = useState<Product[] | null>(null);
  const key = wishlist.join(",");
  useEffect(() => {
    if (!key) { setItems([]); return; }
    api(`/api/products?ids=${key}&limit=48`).then((r) => setItems(r.data.items ?? []));
  }, [key]);

  return (
    <div className="container-x py-8">
      <h1 className="mb-5 text-3xl font-extrabold">My Wishlist ♥</h1>
      {!items ? <p className="text-ink/60">Loading…</p> : items.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-ink/5"><div className="text-5xl">💝</div><p className="mt-3 font-bold">Nothing saved yet. Tap the heart on any toy to save it here.</p><Link href="/products" className="btn btn-primary mt-4">Discover toys</Link></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="flex gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5">
              <Link href={`/products/${p.slug}`} className="w-28 shrink-0"><ProductImage emoji={p.emoji} colors={p.colors} src={p.images?.[0]} className="rounded-2xl [&>span]:!text-5xl" /></Link>
              <div className="flex flex-1 flex-col gap-1 text-sm">
                <Link href={`/products/${p.slug}`} className="font-bold hover:text-brand">{p.name}</Link>
                <span className="font-extrabold text-brand">{formatPrice(finalPrice(p))}</span>
                <span className={p.stock === 0 ? "font-semibold text-red-500" : "font-semibold text-emerald-600"}>{p.stock === 0 ? "Out of stock" : "In stock"}</span>
                <div className="mt-auto flex flex-wrap gap-2">
                  {p.variants.length > 0 ? <Link href={`/products/${p.slug}`} className="btn btn-ghost !px-3 !py-1.5 !text-xs">Choose options</Link>
                    : <button disabled={p.stock === 0} className="btn btn-primary !px-3 !py-1.5 !text-xs disabled:opacity-40" onClick={() => { addToCart({ productId: p.id, qty: 1 }); removeFromWishlist(p.id); }}>Move to cart</button>}
                  <button className="text-xs font-bold text-ink/50 hover:text-brand" onClick={() => removeFromWishlist(p.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
