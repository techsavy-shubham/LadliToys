"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge, Err, inr, label, PageTitle, statusTone, Table, Td, useList } from "@/components/admin/kit";

const STATUSES = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function Page() {
  const [status, setStatus] = useState(""); const [q, setQ] = useState("");
  const { items, error } = useList(`/api/admin/orders?status=${status}&q=${encodeURIComponent(q)}`);
  return (
    <>
      <PageTitle>Orders</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, name or email…" aria-label="Search orders" className="w-full max-w-xs rounded-full border-2 border-ink/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="rounded-full border-2 border-ink/10 bg-white px-4 py-2 text-sm">
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>
      <Err m={error} />
      <Table head={["Order", "Customer", "Date", "Total", "Payment", "Status"]} empty={items && items.length === 0 ? "No orders found." : undefined}>
        {(items ?? []).map((o: any) => (
          <tr key={o.id}>
            <Td><Link href={`/admin/orders/${o.id}`} className="font-bold text-brand">#{o.number}</Link></Td>
            <Td><div className="font-bold">{o.customer?.name ?? "—"}</div><div className="text-xs text-ink/50">{o.customer?.email}</div></Td>
            <Td>{new Date(o.createdAt).toLocaleDateString("en-IN")}</Td><Td>{inr(o.total)}</Td>
            <Td><Badge tone={statusTone(o.paymentStatus)}>{o.paymentMethod === "COD" ? "COD · " : ""}{label(o.paymentStatus)}</Badge></Td>
            <Td><Badge tone={statusTone(o.status)}>{label(o.status)}</Badge></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
