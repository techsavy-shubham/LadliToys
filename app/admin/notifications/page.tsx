"use client";
import { Badge, Err, label, PageTitle, Panel, Table, Td, useList } from "@/components/admin/kit";

export default function Page() {
  const { items, extra, error } = useList("/api/admin/notifications");
  return (
    <>
      <PageTitle>Notifications</PageTitle>
      <Panel className="mb-5">
        <p className="text-sm">Email delivery: {extra.emailConfigured ? <Badge tone="green">Connected</Badge> : <Badge tone="amber">Not connected – messages are logged only</Badge>}</p>
        {!extra.emailConfigured && <p className="mt-2 text-xs text-ink/60">Add <code>RESEND_API_KEY</code> and <code>MAIL_FROM</code> in the hosting environment settings to send these as real emails. Registration, order confirmation, payment, status, shipment and delivery messages are generated automatically.</p>}
      </Panel>
      <Err m={error} />
      <Table head={["When", "To", "Event", "Subject", "Status"]} empty={items && items.length === 0 ? "No notifications yet." : undefined}>
        {(items ?? []).map((n: any) => (
          <tr key={n.id}><Td>{new Date(n.at).toLocaleString("en-IN")}</Td><Td>{n.to}</Td><Td>{label(n.event)}</Td><Td><details><summary className="cursor-pointer font-bold">{n.subject}</summary><pre className="mt-1 whitespace-pre-wrap text-xs text-ink/70">{n.text}</pre></details></Td><Td><Badge tone={n.status === "sent" ? "green" : n.status === "failed" ? "red" : "gray"}>{label(n.status)}</Badge></Td></tr>
        ))}
      </Table>
    </>
  );
}
