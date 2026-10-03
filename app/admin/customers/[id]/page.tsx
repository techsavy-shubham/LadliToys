"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api } from "@/lib/client-state";
import { Badge, inr, label, PageTitle, Panel, statusTone, Table, Td } from "@/components/admin/kit";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<any>(null);
  useEffect(() => { api(`/api/admin/customers/${id}`).then((r) => setD(r.ok ? r.data : { error: true })); }, [id]);
  if (!d) return <p className="text-ink/60">Loading…</p>;
  if (d.error) return <p className="font-bold">Customer not found.</p>;
  const c = d.customer;
  return (
    <>
      <PageTitle action={<Link href="/admin/customers" className="font-bold text-brand">← All customers</Link>}>{c.name}</PageTitle>
      <Panel className="mb-5">
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <div><div className="text-ink/50">Email</div><div className="font-bold">{c.email}</div></div>
          <div><div className="text-ink/50">Phone</div><div className="font-bold">{c.phone || "—"}</div></div>
          <div><div className="text-ink/50">Registered</div><div className="font-bold">{new Date(c.createdAt).toLocaleDateString("en-IN")}</div></div>
          <div><div className="text-ink/50">Status</div><Badge tone={c.active ? "green" : "red"}>{c.active ? "Active" : "Disabled"}</Badge></div>
        </div>
      </Panel>
      <h2 className="mb-2 font-extrabold">Order history</h2>
      <Table head={["Order", "Date", "Total", "Status"]} empty={d.orders.length === 0 ? "No orders yet." : undefined}>
        {d.orders.map((o: any) => (
          <tr key={o.id}><Td><Link href={`/admin/orders/${o.id}`} className="font-bold text-brand">#{o.number}</Link></Td><Td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</Td><Td>{inr(o.total)}</Td><Td><Badge tone={statusTone(o.status)}>{label(o.status)}</Badge></Td></tr>
        ))}
      </Table>
    </>
  );
}
