"use client";
import { useState } from "react";
import { api } from "@/lib/client-state";
import { Err, Field } from "./AuthForm";

export type Addr = { id: string; name: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; isDefault: boolean };
const blank = { name: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India", isDefault: false };

export default function AddressForm({ initial, onSaved, onCancel }: { initial?: Addr; onSaved: (a: Addr) => void; onCancel?: () => void }) {
  const [f, setF] = useState({ ...blank, ...initial });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = initial ? await api(`/api/addresses/${initial.id}`, "PATCH", f) : await api("/api/addresses", "POST", f);
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Could not save address.");
    onSaved(r.data.item);
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name" required value={f.name} onChange={set("name")} />
      <Field label="Phone" type="tel" required value={f.phone} onChange={set("phone")} />
      <div className="sm:col-span-2"><Field label="Address line 1" required value={f.line1} onChange={set("line1")} /></div>
      <div className="sm:col-span-2"><Field label="Address line 2 (optional)" value={f.line2} onChange={set("line2")} /></div>
      <Field label="City" required value={f.city} onChange={set("city")} />
      <Field label="State" required value={f.state} onChange={set("state")} />
      <Field label="Postal code" required value={f.postalCode} onChange={set("postalCode")} />
      <Field label="Country" required value={f.country} onChange={set("country")} />
      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input type="checkbox" checked={f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} /> Make this my default address
      </label>
      <div className="sm:col-span-2"><Err m={err} /></div>
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={busy} className="btn btn-primary">{busy ? "Saving…" : "Save address"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>}
      </div>
    </form>
  );
}
