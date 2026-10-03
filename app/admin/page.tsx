"use client";
import Link from "next/link";
import BarChart from "@/components/admin/BarChart";
import { Badge, Err, inr, label, PageTitle, Panel, Stat, statusTone, useList } from "@/components/admin/kit";

export default function Page() {
  const { extra: s, error, items } = useList("/api/admin/stats?days=14");
  if (!items && !s.totals) return <p className="text-ink/60">Loading…</p>;
  if (!s.totals) return <Err m={error || "Could not load dashboard."} />;
  const t = s.totals;
  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total sales" value={inr(t.sales)} /><Stat label="Orders" value={t.orders} /><Stat label="Customers" value={t.customers} />
        <Stat label="Products" value={t.products} /><Stat label="Pending" value={t.pending} sub="in progress" /><Stat label="Completed" value={t.completed} sub="delivered" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <Panel title="Sales – last 14 days"><BarChart data={s.series} /></Panel>
        <Panel title={`Low-stock toys (${s.lowStockCount})`}>
          {s.lowStock.length === 0 ? <p className="text-sm text-ink/50">All products are well stocked. 🎉</p> : (
            <ul className="space-y-2 text-sm">{s.lowStock.slice(0, 8).map((p: any) => <li key={p.id} className="flex justify-between gap-2"><span className="truncate">{p.name}</span><Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Out" : p.stock}</Badge></li>)}</ul>
          )}
          <Link href="/admin/inventory" className="mt-3 inline-block text-sm font-bold text-brand">Manage inventory →</Link>
        </Panel>
        <Panel title="Recent orders">
          {s.recentOrders.length === 0 ? <p className="text-sm text-ink/50">No orders yet.</p> : (
            <ul className="divide-y divide-ink/5 text-sm">{s.recentOrders.map((o: any) => <li key={o.id} className="flex items-center justify-between gap-2 py-2"><Link href={`/admin/orders/${o.id}`} className="font-bold text-brand">#{o.number}</Link><span>{inr(o.total)}</span><Badge tone={statusTone(o.status)}>{label(o.status)}</Badge></li>)}</ul>
          )}
        </Panel>
        <Panel title="Recent customers">
          {s.recentCustomers.length === 0 ? <p className="text-sm text-ink/50">No customers yet.</p> : (
            <ul className="divide-y divide-ink/5 text-sm">{s.recentCustomers.map((c: any) => <li key={c.id} className="py-2"><Link href={`/admin/customers/${c.id}`} className="font-bold hover:text-brand">{c.name}</Link><div className="text-xs text-ink/50">{c.email}</div></li>)}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
