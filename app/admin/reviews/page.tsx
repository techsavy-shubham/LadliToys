"use client";
import { api } from "@/lib/client-state";
import { Badge, Err, PageTitle, Table, Td, useList } from "@/components/admin/kit";

export default function Page() {
  const { items, error, reload } = useList("/api/admin/reviews");
  return (
    <>
      <PageTitle>Review moderation</PageTitle>
      <Err m={error} />
      <Table head={["Product", "Review", "By", "Status", ""]} empty={items && items.length === 0 ? "No reviews yet." : undefined}>
        {(items ?? []).map((r: any) => (
          <tr key={r.id}>
            <Td className="font-bold">{r.productName}</Td>
            <Td className="max-w-sm"><span className="text-amber-500">{"★".repeat(r.rating)}</span><span className="text-ink/20">{"★".repeat(5 - r.rating)}</span><div className="text-ink/70">{r.body}</div></Td>
            <Td>{r.name}<div className="text-xs text-ink/50">{new Date(r.createdAt).toLocaleDateString("en-IN")}</div></Td>
            <Td><Badge tone={r.approved ? "green" : "gray"}>{r.approved ? "Visible" : "Hidden"}</Badge></Td>
            <Td className="whitespace-nowrap">
              <button className="mr-3 font-bold text-brand" onClick={async () => { await api(`/api/admin/reviews/${r.id}`, "PATCH", { approved: !r.approved }); reload(); }}>{r.approved ? "Hide" : "Approve"}</button>
              <button className="font-bold text-red-600" onClick={async () => { if (confirm("Delete this review?")) { await api(`/api/admin/reviews/${r.id}`, "DELETE"); reload(); } }}>Delete</button>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
