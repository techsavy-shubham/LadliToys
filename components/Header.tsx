import Link from "next/link";
import { categories } from "@/lib/data";
import HeaderActions from "./HeaderActions";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 shadow-sm backdrop-blur">
      <div className="bg-ink py-1.5 text-center text-xs font-semibold text-white">
        🚚 Free shipping on orders over ₹999 · Safe, certified toys
      </div>
      <div className="container-x flex items-center gap-3 py-3">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold text-brand">
          <span aria-hidden>🧸</span> Ladli<span className="text-sun">Toys</span>
        </Link>
        <form action="/products" className="mx-2 hidden flex-1 md:block">
          <input
            name="q" type="search" placeholder="Search toys, brands, SKU…" aria-label="Search"
            className="w-full rounded-full border-2 border-ink/10 bg-cream px-5 py-2 text-sm outline-none focus:border-brand"
          />
        </form>
        <HeaderActions />
      </div>
      <form action="/products" className="container-x pb-3 md:hidden">
        <input name="q" type="search" placeholder="Search toys…" aria-label="Search"
          className="w-full rounded-full border-2 border-ink/10 bg-cream px-5 py-2 text-sm outline-none focus:border-brand" />
      </form>
      <div className="border-t border-ink/5">
        <div className="container-x flex gap-1 overflow-x-auto py-2 text-sm font-semibold [scrollbar-width:none]">
          {categories.map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="whitespace-nowrap rounded-full px-3 py-1 hover:bg-sun/30">
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
