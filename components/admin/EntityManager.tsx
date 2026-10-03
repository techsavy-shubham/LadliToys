"use client";
import { useState } from "react";
import { api } from "@/lib/client-state";
import { Check, Err, Input, Modal, PageTitle, Select, Table, Td, Textarea, useList } from "./kit";

export type Field = { key: string; label: string; type?: "text" | "number" | "checkbox" | "select" | "color" | "date" | "textarea"; options?: [string, string][]; hint?: string; required?: boolean };
export type Col = { label: string; render: (i: any) => React.ReactNode };

export default function EntityManager({ title, singular, endpoint, columns, fields, blank, activeKey = "active" }: {
  title: string; singular: string; endpoint: string; columns: Col[]; fields: Field[]; blank: Record<string, any>; activeKey?: string | null;
}) {
  const { items, error, reload } = useList(endpoint);
  const [editing, setEditing] = useState<any | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = editing.id ? await api(`${endpoint}/${editing.id}`, "PATCH", editing) : await api(endpoint, "POST", editing);
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Could not save.");
    setEditing(null); reload();
  }
  async function remove(i: any) {
    if (!confirm(`Delete this ${singular}?`)) return;
    const r = await api(`${endpoint}/${i.id}`, "DELETE");
    if (!r.ok) alert(r.data.error || "Could not delete."); else reload();
  }
  const set = (k: string, v: any) => setEditing((x: any) => ({ ...x, [k]: v }));

  return (
    <>
      <PageTitle action={<button className="btn btn-primary" onClick={() => { setErr(""); setEditing({ ...blank }); }}>+ Add {singular}</button>}>{title}</PageTitle>
      <Err m={error} />
      <Table head={[...columns.map((c) => c.label), "Actions"]} empty={items && items.length === 0 ? `No ${title.toLowerCase()} yet.` : undefined}>
        {(items ?? []).map((i: any) => (
          <tr key={i.id}>
            {columns.map((c) => <Td key={c.label}>{c.render(i)}</Td>)}
            <Td className="whitespace-nowrap">
              <button className="mr-3 font-bold text-brand" onClick={() => { setErr(""); setEditing({ ...i }); }}>Edit</button>
              {activeKey && <button className="mr-3 font-bold text-ink/60" onClick={async () => { await api(`${endpoint}/${i.id}`, "PATCH", { [activeKey]: !i[activeKey] }); reload(); }}>{i[activeKey] ? "Deactivate" : "Activate"}</button>}
              <button className="font-bold text-red-600" onClick={() => remove(i)}>Delete</button>
            </Td>
          </tr>
        ))}
      </Table>
      {editing && (
        <Modal title={`${editing.id ? "Edit" : "Add"} ${singular}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => {
              const v = editing[f.key] ?? "";
              if (f.type === "checkbox") return <div key={f.key} className="self-end"><Check label={f.label} checked={!!editing[f.key]} onChange={(e) => set(f.key, e.target.checked)} /></div>;
              if (f.type === "select") return <Select key={f.key} label={f.label} value={v} onChange={(e) => set(f.key, e.target.value)}>{f.options!.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</Select>;
              if (f.type === "textarea") return <div key={f.key} className="sm:col-span-2"><Textarea label={f.label} rows={3} value={v} onChange={(e) => set(f.key, e.target.value)} /></div>;
              if (f.type === "date") return <Input key={f.key} label={f.label} type="date" hint={f.hint} value={v ? String(v).slice(0, 10) : ""} onChange={(e) => set(f.key, e.target.value)} />;
              return <Input key={f.key} label={f.label} type={f.type ?? "text"} hint={f.hint} required={f.required} value={v} onChange={(e) => set(f.key, e.target.value)} />;
            })}
            <div className="sm:col-span-2"><Err m={err} /></div>
            <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save"}</button><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
