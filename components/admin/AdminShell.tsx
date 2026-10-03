"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/client-state";

const NAV: [string, string][] = [
  ["/admin", "📊 Dashboard"], ["/admin/orders", "📦 Orders"], ["/admin/products", "🧸 Products"], ["/admin/inventory", "🗃️ Inventory"],
  ["/admin/categories", "🗂️ Categories"], ["/admin/brands", "🏷️ Brands"], ["/admin/customers", "👥 Customers"], ["/admin/coupons", "🎟️ Coupons"],
  ["/admin/banners", "🖼️ Banners"], ["/admin/reviews", "⭐ Reviews"], ["/admin/payments", "💳 Payments"], ["/admin/analytics", "📈 Analytics"], ["/admin/notifications", "✉️ Notifications"],
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useStore();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (!authLoading && !user) router.replace("/login?next=/admin"); }, [authLoading, user, router]);

  if (authLoading || !user) return <div className="container-x py-20 text-center text-ink/60">Loading…</div>;
  if (user.role !== "ADMIN") return (
    <div className="container-x py-20 text-center"><div className="text-5xl">🔒</div><h1 className="mt-3 text-2xl font-extrabold">Admins only</h1><p className="mt-1 text-ink/60">Your account doesn&apos;t have access to the dashboard.</p><Link href="/" className="btn btn-primary mt-5">Back to store</Link></div>
  );
  return (
    <div className="container-x grid gap-6 py-6 lg:grid-cols-[210px_1fr]">
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Admin">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${(href === "/admin" ? path === href : path.startsWith(href)) ? "bg-brand text-white" : "bg-white ring-1 ring-ink/10 hover:ring-brand"}`}>{label}</Link>
        ))}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
