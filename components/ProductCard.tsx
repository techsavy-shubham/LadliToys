import Link from "next/link";
import { finalPrice, formatPrice, type Product } from "@/lib/data";
import ProductImage from "./ProductImage";
import { QuickAdd, WishlistHeart } from "./CardActions";

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} out of 5`}>
      {"★".repeat(Math.round(rating))}<span className="text-ink/20">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export default function ProductCard({ p }: { p: Product }) {
  const out = p.stock === 0;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${p.slug}`} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden">
          <ProductImage emoji={p.emoji} colors={p.colors} src={p.images?.[0]} className="transition group-hover:scale-105" />
          {p.discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-white">-{p.discountPercent}%</span>
          )}
          {p.isNew && p.discountPercent === 0 && <span className="absolute left-3 top-3 rounded-full bg-sun px-2.5 py-1 text-xs font-extrabold text-ink">NEW</span>}
          {out && <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-extrabold">Out of stock</div>}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4 pb-2">
          <span className="text-xs font-semibold text-ink/50">{p.ageLabel}</span>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug">{p.name}</h3>
          <div className="flex items-center gap-1 text-xs"><Stars rating={p.rating} /><span className="text-ink/50">({p.reviewCount})</span></div>
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-extrabold text-brand">{formatPrice(finalPrice(p))}</span>
            {p.discountPercent > 0 && <span className="text-xs text-ink/40 line-through">{formatPrice(p.price)}</span>}
          </div>
          <span className={`text-xs font-semibold ${out ? "text-red-500" : p.stock < 10 ? "text-amber-600" : "text-emerald-600"}`}>
            {out ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left` : "In stock"}
          </span>
        </div>
      </Link>
      <WishlistHeart productId={p.id} className="absolute right-3 top-3" />
      <div className="p-4 pt-1"><QuickAdd productId={p.id} slug={p.slug} hasVariants={p.variants.length > 0} out={out} /></div>
    </div>
  );
}
