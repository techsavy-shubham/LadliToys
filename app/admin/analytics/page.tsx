"use client";
import { useState } from "react";
import BarChart from "@/components/admin/BarChart";
import { Badge, Err, inr, PageTitle, Panel, Stat, Table, Td, useList } from "@/components/admin/kit";

export default function Page() {
  const [days, setDays] = useState(30);
  const { extra: s, error } = useList(`/api/admin/stats?days=${days}`);
  return (
    <>
      <PageTitle action={
        <div className="flex gap-1" role="group" aria-label="Period">
          {[7, 30, 90].map((d) => <button key={d} onClick={() => setDays(d)} className={`btn !px-4 !py-1.5 ${days === d ? "btn-primary" : "btn-ghost"}`}>{d} days</button>)}
        </div>}>Sales analytics</PageTitle>
      <Err m={error} />
      {s.period && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Revenue" value={inr(s.period.revenue)} sub={`last ${days} days`} /><Stat label="Orders" value={s.period.orders} />
            <Stat label="Avg. order value" value={inr(s.period.aov)} /><Stat label="New customers" value={s.period.newCustomers} sub={`${s.totals.customers} total`} />
          </div>
          <Panel title="Sales by day" className="mt-5"><BarChart data={s.series} /></Panel>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div><h2 className="mb-2 font-extrabold">Best-selling toys</h2>
              <Table head={["Toy", "Units", "Revenue"]} empty={s.bestSellers.length === 0 ? "No sales in this period." : undefined}>
                {s.bestSellers.map((b: any) => <tr key={b.name}><Td className="font-bold">{b.name}</Td><Td>{b.qty}</Td><Td>{inr(b.revenue)}</Td></tr>)}
              </Table></div>
            <div><h2 className="mb-2 font-extrabold">Low-stock products ({s.lowStockCount})</h2>
              <Table head={["Product", "SKU", "Stock"]} empty={s.lowStock.length === 0 ? "Nothing low on stock." : undefined}>
                {s.lowStock.map((p: any) => <tr key={p.id}><Td className="font-bold">{p.name}</Td><Td className="font-mono text-xs">{p.sku}</Td><Td><Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock}</Badge></Td></tr>)}
              </Table></div>
          </div>
        </>
      )}
    </>
  );
}
