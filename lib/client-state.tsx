"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type SessionUser = { id: string; name: string; email: string; phone: string; role: string };
export type CartItem = { productId: string; variantId?: string; qty: number };

type Ctx = {
  user: SessionUser | null; authLoading: boolean; persistent: boolean;
  refreshUser: () => Promise<void>; logout: () => Promise<void>; setUser: (u: SessionUser | null) => void;
  cart: CartItem[]; cartCount: number;
  addToCart: (i: CartItem) => void; setQty: (productId: string, variantId: string | undefined, qty: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void; clearCart: () => void;
  wishlist: string[]; toggleWishlist: (productId: string) => void; removeFromWishlist: (productId: string) => void;
};

const C = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(C);

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const same = (a: CartItem, productId: string, variantId?: string) => a.productId === productId && a.variantId === variantId;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [persistent, setPersistent] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const hydrated = useRef(false);
  const syncedFor = useRef<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      const d = await r.json();
      setUser(d.user); setPersistent(d.persistent !== false);
    } finally { setAuthLoading(false); }
  }, []);

  useEffect(() => {
    setCart(read("ladli_cart", []));
    setWishlist(read("ladli_wishlist", []));
    hydrated.current = true;
    refreshUser();
  }, [refreshUser]);

  useEffect(() => { if (hydrated.current) write("ladli_cart", cart); }, [cart]);
  useEffect(() => { if (hydrated.current) write("ladli_wishlist", wishlist); }, [wishlist]);

  // On login, merge the guest wishlist with the saved one; afterwards keep the server copy in sync.
  useEffect(() => {
    if (!user || !hydrated.current) { if (!user) syncedFor.current = null; return; }
    if (syncedFor.current !== user.id) {
      syncedFor.current = user.id;
      fetch("/api/wishlist").then((r) => r.json()).then((d) => {
        const merged = [...new Set([...(d.ids ?? []), ...read<string[]>("ladli_wishlist", [])])];
        setWishlist(merged);
        fetch("/api/wishlist", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: merged }) });
      }).catch(() => {});
    }
  }, [user]);

  const saveWishlist = (ids: string[]) => {
    setWishlist(ids);
    if (user) fetch("/api/wishlist", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }).catch(() => {});
  };

  const value: Ctx = {
    user, authLoading, persistent, refreshUser, setUser,
    logout: async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); },
    cart, cartCount: cart.reduce((a, i) => a + i.qty, 0),
    addToCart: (i) => setCart((c) => c.some((x) => same(x, i.productId, i.variantId))
      ? c.map((x) => (same(x, i.productId, i.variantId) ? { ...x, qty: Math.min(x.qty + i.qty, 20) } : x))
      : [...c, { ...i, qty: Math.min(i.qty, 20) }]),
    setQty: (p, v, qty) => setCart((c) => c.map((x) => (same(x, p, v) ? { ...x, qty: Math.max(1, Math.min(qty, 20)) } : x))),
    removeFromCart: (p, v) => setCart((c) => c.filter((x) => !same(x, p, v))),
    clearCart: () => setCart([]),
    wishlist,
    toggleWishlist: (id) => saveWishlist(wishlist.includes(id) ? wishlist.filter((x) => x !== id) : [...wishlist, id]),
    removeFromWishlist: (id) => saveWishlist(wishlist.filter((x) => x !== id)),
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export async function api<T = any>(url: string, method = "GET", body?: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}
