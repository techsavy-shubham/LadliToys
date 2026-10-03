"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client-state";
import { Badge, Err, inr, PageTitle, Table, Td, useList } from "@/components/admin/kit";

export default function Page() {
  const { items, error, reload } = useList("/api/admin/customers");
  const [q, setQ] = useState("");
  const rows = (items ?? []).filter((c: any) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageTitle>Customers</PageTitle>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" aria-label="Search customers" className="mb-4 w-full max-w-sm rounded-full border-2 border-ink/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand" />
      <Err m={error} />
      <Table head={["Customer", "Phone", "Joined", "Orders", "Spent", "Status", ""]} empty={items && rows.length === 0 ? "No customers yet." : undefined}>
        {rows.map((c: any) => (
          <tr key={c.id}>
            <Td><div className="font-bold">{c.name}</div><div className="text-xs text-ink/50">{c.email}</div></Td>
            <Td>{c.phone || "—"}</Td><Td>{new Date(c.createdAt).toLocaleDateString("en-IN")}</Td><Td>{c.orderCount}</Td><Td>{inr(c.totalSpent)}</Td>
            <Td><Badge tone={c.active ? "green" : "red"}>{c.active ? "Active" : "Disabled"}</Badge></Td>
            <Td className="whitespace-nowrap">
              <Link href={`/admin/customers/${c.id}`} className="mr-3 font-bold text-brand">View</Link>
              <button className="font-bold text-ink/60" onClick={async () => { await api(`/api/admin/customers/${c.id}`, "PATCH", { active: !c.active }); reload(); }}>{c.active ? "Disable" : "Enable"}</button>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
