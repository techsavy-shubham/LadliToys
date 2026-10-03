"use client";
import Link from "next/link";
import { Badge, Err, inr, label, PageTitle, statusTone, Table, Td, useList } from "@/components/admin/kit";

export default function Page() {
  const { items, error } = useList("/api/admin/payments");
  return (
    <>
      <PageTitle>Payments</PageTitle>
      <Err m={error} />
      <Table head={["Order", "Provider", "Reference", "Amount", "Status", "Date"]} empty={items && items.length === 0 ? "No online payments yet. Cash-on-delivery orders appear under Orders." : undefined}>
        {(items ?? []).map((p: any) => (
          <tr key={p.id}>
            <Td><Link href={`/admin/orders/${p.orderId}`} className="font-bold text-brand">#{p.orderNumber ?? "—"}</Link></Td>
            <Td>{p.provider === "sandbox" ? "Sandbox (test)" : "Razorpay"}</Td>
            <Td className="font-mono text-xs">{p.providerPaymentId || p.providerOrderId}</Td>
            <Td>{inr(p.amount)}{p.refundedAmount ? <div className="text-xs text-red-700">refunded {inr(p.refundedAmount)}</div> : null}</Td>
            <Td><Badge tone={statusTone(p.status)}>{label(p.status)}</Badge></Td>
            <Td>{new Date(p.createdAt).toLocaleString("en-IN")}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
