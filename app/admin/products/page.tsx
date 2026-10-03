"use client";
import { useEffect, useState } from "react";
import { Badge, Check, Err, Input, inr, Modal, PageTitle, Select, Table, Td, Textarea, useList } from "@/components/admin/kit";
import ProductImage from "@/components/ProductImage";
import { api } from "@/lib/client-state";
import { ageGroups, finalPrice } from "@/lib/data";

const blank = { name: "", description: "", price: "", discountPercent: 0, stock: 0, categorySlug: "", brandSlug: "", ageGroup: "3-5", ageLabel: "3+ years", emoji: "🧸", sku: "", material: "", safety: "", featured: false, isNew: false, published: true, images: [] as string[], variants: [] as any[] };

export default function Page() {
  const { items, error, reload } = useList("/api/admin/products");
  const cats = useList("/api/admin/categories").items ?? [];
  const brands = useList("/api/admin/brands").items ?? [];
  const [q, setQ] = useState("");
  const [ed, setEd] = useState<any | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [up, setUp] = useState(false);
  useEffect(() => { document.title = "Products | Ladli Admin"; }, []);

  const set = (k: string, v: any) => setEd((x: any) => ({ ...x, [k]: v }));
  const rows = (items ?? []).filter((p: any) => !q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = ed.id ? await api(`/api/admin/products/${ed.id}`, "PATCH", ed) : await api("/api/admin/products", "POST", ed);
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Could not save.");
    setEd(null); reload();
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUp(true); setErr("");
    for (const f of Array.from(files).slice(0, 8)) {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || "Upload failed."); break; }
      setEd((x: any) => ({ ...x, images: [...(x.images ?? []), d.url] }));
    }
    setUp(false);
  }
  const setVar = (i: number, k: string, v: any) => set("variants", ed.variants.map((x: any, n: number) => (n === i ? { ...x, [k]: v } : x)));

  return (
    <>
      <PageTitle action={<button className="btn btn-primary" onClick={() => { setErr(""); setEd({ ...blank, categorySlug: cats[0]?.slug ?? "", brandSlug: brands[0]?.slug ?? "" }); }}>+ Add product</button>}>Products</PageTitle>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU…" aria-label="Search products" className="mb-4 w-full max-w-sm rounded-full border-2 border-ink/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand" />
      <Err m={error} />
      <Table head={["Product", "SKU", "Price", "Stock", "Status", "Actions"]} empty={items && rows.length === 0 ? "No products found." : undefined}>
        {rows.map((p: any) => (
          <tr key={p.id}>
            <Td><div className="flex items-center gap-3"><ProductImage emoji={p.emoji} colors={p.colors} src={p.images?.[0]} className="h-10 w-10 shrink-0 rounded-lg [&>span]:!text-xl" /><div><div className="font-bold">{p.name}</div>{p.variants.length > 0 && <div className="text-xs text-ink/50">{p.variants.length} variants</div>}</div></div></Td>
            <Td className="font-mono text-xs">{p.sku}</Td>
            <Td>{inr(finalPrice(p))}{p.discountPercent > 0 && <span className="ml-1 text-xs text-ink/40 line-through">{inr(p.price)}</span>}</Td>
            <Td><Badge tone={p.stock === 0 ? "red" : p.stock < 10 ? "amber" : "green"}>{p.stock}</Badge></Td>
            <Td><Badge tone={p.published ? "green" : "gray"}>{p.published ? "Published" : "Draft"}</Badge></Td>
            <Td className="whitespace-nowrap">
              <button className="mr-3 font-bold text-brand" onClick={() => { setErr(""); setEd({ ...blank, ...p }); }}>Edit</button>
              <button className="mr-3 font-bold text-ink/60" onClick={async () => { await api(`/api/admin/products/${p.id}`, "PATCH", { published: !p.published }); reload(); }}>{p.published ? "Unpublish" : "Publish"}</button>
              <button className="font-bold text-red-600" onClick={async () => { if (confirm(`Delete "${p.name}"?`)) { await api(`/api/admin/products/${p.id}`, "DELETE"); reload(); } }}>Delete</button>
            </Td>
          </tr>
        ))}
      </Table>

      {ed && (
        <Modal title={ed.id ? "Edit product" : "Add product"} onClose={() => setEd(null)}>
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input label="Name" required value={ed.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="sm:col-span-2"><Textarea label="Description" rows={3} value={ed.description} onChange={(e) => set("description", e.target.value)} /></div>
            <Input label="Price (₹)" type="number" min={1} required value={ed.price} onChange={(e) => set("price", e.target.value)} />
            <Input label="Discount (%)" type="number" min={0} max={90} value={ed.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} />
            <Select label="Category" value={ed.categorySlug} onChange={(e) => set("categorySlug", e.target.value)}>{cats.map((c: any) => <option key={c.id} value={c.slug}>{c.name}</option>)}</Select>
            <Select label="Brand" value={ed.brandSlug} onChange={(e) => set("brandSlug", e.target.value)}>{brands.map((b: any) => <option key={b.id} value={b.slug}>{b.name}</option>)}</Select>
            <Select label="Age group" value={ed.ageGroup} onChange={(e) => set("ageGroup", e.target.value)}>{ageGroups.map((a) => <option key={a.slug} value={a.slug}>{a.label}</option>)}</Select>
            <Input label="Age label" value={ed.ageLabel} onChange={(e) => set("ageLabel", e.target.value)} hint="Shown on cards, e.g. 3+ years" />
            <Input label="SKU" value={ed.sku} onChange={(e) => set("sku", e.target.value)} hint="Leave blank to auto-generate" />
            <Input label="Emoji (placeholder art)" value={ed.emoji} onChange={(e) => set("emoji", e.target.value)} />
            {ed.variants.length === 0 && <Input label="Stock" type="number" min={0} value={ed.stock} onChange={(e) => set("stock", e.target.value)} />}
            <Input label="Material" value={ed.material} onChange={(e) => set("material", e.target.value)} />
            <div className="sm:col-span-2"><Textarea label="Safety notes" rows={2} value={ed.safety} onChange={(e) => set("safety", e.target.value)} /></div>

            <div className="sm:col-span-2">
              <div className="mb-1 text-sm font-bold">Images</div>
              <div className="flex flex-wrap gap-2">
                {ed.images.map((u: string) => (
                  <div key={u} className="relative"><img src={u} alt="" className="h-20 w-20 rounded-xl object-cover" /><button type="button" aria-label="Remove image" onClick={() => set("images", ed.images.filter((x: string) => x !== u))} className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 text-xs text-white">×</button></div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-ink/20 text-center text-xs font-bold text-ink/50">{up ? "…" : "+ Upload"}<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} /></label>
              </div>
              <p className="mt-1 text-xs text-ink/50">JPG, PNG, WebP or GIF, up to 1 MB each. The first image is the main photo.</p>
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between text-sm font-bold">Variants <button type="button" className="text-brand" onClick={() => set("variants", [...ed.variants, { label: "", price: ed.price || 0, stock: 0 }])}>+ Add variant</button></div>
              {ed.variants.map((v: any, i: number) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_90px_80px_auto] items-end gap-2">
                  <Input label={i === 0 ? "Option" : ""} aria-label="Variant option" placeholder="e.g. Red / 500 pcs" value={v.label} onChange={(e) => setVar(i, "label", e.target.value)} />
                  <Input label={i === 0 ? "Price" : ""} aria-label="Variant price" type="number" value={v.price} onChange={(e) => setVar(i, "price", e.target.value)} />
                  <Input label={i === 0 ? "Stock" : ""} aria-label="Variant stock" type="number" min={0} value={v.stock} onChange={(e) => setVar(i, "stock", e.target.value)} />
                  <button type="button" aria-label="Remove variant" className="pb-2 text-xl text-red-600" onClick={() => set("variants", ed.variants.filter((_: any, n: number) => n !== i))}>×</button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <Check label="Published" checked={ed.published} onChange={(e) => set("published", e.target.checked)} />
              <Check label="Featured" checked={ed.featured} onChange={(e) => set("featured", e.target.checked)} />
              <Check label="New arrival" checked={ed.isNew} onChange={(e) => set("isNew", e.target.checked)} />
            </div>
            <div className="sm:col-span-2"><Err m={err} /></div>
            <div className="flex gap-2 sm:col-span-2"><button disabled={busy || up} className="btn btn-primary">{busy ? "Saving…" : "Save product"}</button><button type="button" className="btn btn-ghost" onClick={() => setEd(null)}>Cancel</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
