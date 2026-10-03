"use client";
import { useState } from "react";
import { Badge, Err, PageTitle, Table, Td, useList } from "@/components/admin/kit";
import { api } from "@/lib/client-state";

const LOW = 10;

function StockInput({ value, onSave }: { value: number; onSave: (n: number) => Promise<void> }) {
  const [v, setV] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const dirty = Number(v) !== value;
  return (
    <span className="inline-flex items-center gap-2">
      <input type="number" min={0} value={v} aria-label="Stock quantity" onChange={(e) => setV(e.target.value)} className="w-20 rounded-lg border-2 border-ink/10 px-2 py-1 outline-none focus:border-brand" />
      {dirty && <button disabled={saving} className="btn btn-primary !px-3 !py-1 !text-xs" onClick={async () => { setSaving(true); await onSave(Math.max(0, Math.round(Number(v) || 0))); setSaving(false); }}>{saving ? "…" : "Save"}</button>}
    </span>
  );
}

export default function Page() {
  const { items, error, reload } = useList("/api/admin/products");
  const [low, setLow] = useState(false);
  const [err, setErr] = useState("");
  const rows = (items ?? []).filter((p: any) => !low || p.stock < LOW || p.variants.some((v: any) => v.stock < LOW));

  async function update(p: any, patch: any) {
    const r = await api(`/api/admin/products/${p.id}`, "PATCH", patch);
    if (!r.ok) setErr(r.data.error || "Could not update stock."); else { setErr(""); await reload(); }
  }
  const tone = (n: number) => (n === 0 ? "red" : n < LOW ? "amber" : "green") as "red" | "amber" | "green";
  const text = (n: number) => (n === 0 ? "Out of stock" : n < LOW ? "Low stock" : "In stock");

  return (
    <>
      <PageTitle action={<label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low / out of stock only</label>}>Inventory</PageTitle>
      <Err m={error || err} />
      <Table head={["Product / variant", "SKU", "Stock", "Status"]} empty={items && rows.length === 0 ? "Nothing to show." : undefined}>
        {rows.flatMap((p: any) =>
          p.variants.length === 0
            ? [<tr key={p.id}><Td className="font-bold">{p.name}</Td><Td className="font-mono text-xs">{p.sku}</Td><Td><StockInput value={p.stock} onSave={(n) => update(p, { stock: n })} /></Td><Td><Badge tone={tone(p.stock)}>{text(p.stock)}</Badge></Td></tr>]
            : [
              <tr key={p.id} className="bg-cream/60"><Td className="font-bold">{p.name}</Td><Td className="font-mono text-xs">{p.sku}</Td><Td>{p.stock} total</Td><Td><Badge tone={tone(p.stock)}>{text(p.stock)}</Badge></Td></tr>,
              ...p.variants.map((v: any) => (
                <tr key={v.id}><Td className="pl-8 text-ink/70">↳ {v.label}</Td><Td className="font-mono text-xs">{v.sku}</Td>
                  <Td><StockInput value={v.stock} onSave={(n) => update(p, { variants: p.variants.map((x: any) => (x.id === v.id ? { ...x, stock: n } : x)) })} /></Td>
                  <Td><Badge tone={tone(v.stock)}>{text(v.stock)}</Badge></Td></tr>
              )),
            ],
        )}
      </Table>
    </>
  );
}
