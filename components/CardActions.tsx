"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/client-state";

export function WishlistHeart({ productId, className = "" }: { productId: string; className?: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const on = wishlist.includes(productId);
  return (
    <button
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={on}
      onClick={() => toggleWishlist(productId)}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow transition hover:scale-110 ${on ? "text-brand" : "text-ink/40"} ${className}`}
    >{on ? "♥" : "♡"}</button>
  );
}

export function QuickAdd({ productId, slug, hasVariants, out }: { productId: string; slug: string; hasVariants: boolean; out: boolean }) {
  const { addToCart } = useStore();
  const [done, setDone] = useState(false);
  if (out) return <span className="btn w-full bg-ink/5 text-ink/40">Out of stock</span>;
  if (hasVariants) return <Link href={`/products/${slug}`} className="btn btn-ghost w-full !py-2">Choose options</Link>;
  return (
    <button className="btn btn-primary w-full !py-2" onClick={() => { addToCart({ productId, qty: 1 }); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? "Added ✓" : "Add to cart"}
    </button>
  );
}
