"use client";
import Link from "next/link";
import { useStore } from "@/lib/client-state";

const Badge = ({ n }: { n: number }) =>
  n > 0 ? <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-extrabold text-white">{n}</span> : null;

export default function HeaderActions() {
  const { user, authLoading, logout, cartCount, wishlist } = useStore();
  return (
    <nav className="ml-auto flex items-center gap-0.5 text-sm font-bold">
      <Link href="/products" className="hidden rounded-full px-3 py-2 hover:bg-cream sm:inline">Shop</Link>
      <Link href="/wishlist" className="rounded-full px-3 py-2 hover:bg-cream">♡<span className="hidden sm:inline"> Wishlist</span><Badge n={wishlist.length} /></Link>
      <Link href="/cart" className="rounded-full px-3 py-2 hover:bg-cream">🛒<span className="hidden sm:inline"> Cart</span><Badge n={cartCount} /></Link>
      {authLoading ? null : user ? (
        <div className="group relative">
          <Link href="/account" className="rounded-full px-3 py-2 hover:bg-cream">👤 <span className="hidden sm:inline">{user.name.split(" ")[0]}</span></Link>
          <div className="invisible absolute right-0 top-full z-50 w-44 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-ink/5 group-hover:visible group-focus-within:visible">
            <Link href="/account" className="block rounded-xl px-3 py-2 hover:bg-cream">My account</Link>
            <Link href="/account/orders" className="block rounded-xl px-3 py-2 hover:bg-cream">My orders</Link>
            <button onClick={logout} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-cream">Log out</button>
          </div>
        </div>
      ) : (
        <Link href="/login" className="btn btn-primary ml-1 !py-2">Log in</Link>
      )}
    </nav>
  );
}
