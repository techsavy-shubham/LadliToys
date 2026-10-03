"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-state";
import { Badge, Err, Input, inr, label, PageTitle, Panel, Select, statusTone } from "@/components/admin/kit";
import ProductImage from "@/components/ProductImage";

const NEXT = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(""); const [note, setNote] = useState("");
  const [trk, setTrk] = useState({ carrier: "", number: "", url: "" });
  const [refund, setRefund] = useState("");

  const load = useCallback(async () => {
    const r = await api(`/api/admin/orders/${id}`);
    if (!r.ok) return setD({ error: true });
    setD(r.data); setStatus(r.data.order.status); setTrk({ carrier: r.data.order.tracking?.carrier ?? "", number: r.data.order.tracking?.number ?? "", url: r.data.order.tracking?.url ?? "" });
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function act(body: any, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true); setErr("");
    const r = await api(`/api/admin/orders/${id}`, "PATCH", body);
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Action failed.");
    setNote(""); setRefund(""); await load();
  }

  if (!d) return <p className="text-ink/60">Loading…</p>;
  if (d.error) return <p className="font-bold">Order not found.</p>;
  const o = d.order, c = d.customer;
  const closed = ["CANCELLED", "REFUNDED"].includes(o.status);
  const awaiting = o.status === "PENDING_PAYMENT" && o.paymentStatus !== "PAID";

  return (
    <>
      <PageTitle action={<Link href="/admin/orders" className="font-bold text-brand">← All orders</Link>}>Order #{o.number}</PageTitle>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Panel title="Items">
            <ul className="divide-y divide-ink/5">
              {o.items.map((i: any, n: number) => (
                <li key={n} className="flex items-center gap-3 py-2 text-sm">
                  <ProductImage emoji={i.emoji} colors={i.colors} src={i.image} className="h-12 w-12 rounded-xl [&>span]:!text-2xl" />
                  <div className="flex-1"><div className="font-bold">{i.name}</div><div className="text-ink/60">{i.variantLabel && `${i.variantLabel} · `}Qty {i.qty} × {inr(i.unitPrice)}</div></div>
                  <div className="font-bold">{inr(i.qty * i.unitPrice)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{inr(o.itemsTotal)}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Coupon {o.couponCode}</span><span>−{inr(o.discount)}</span></div>}
              <div className="flex justify-between"><span>Shipping</span><span>{o.shipping ? inr(o.shipping) : "FREE"}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{inr(o.tax)}</span></div>
              <div className="flex justify-between text-base font-extrabold"><span>Total</span><span>{inr(o.total)}</span></div>
              {o.refundedAmount > 0 && <div className="flex justify-between font-bold text-red-700"><span>Refunded</span><span>−{inr(o.refundedAmount)}</span></div>}
            </div>
          </Panel>
          <Panel title="Customer & delivery">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div><div className="font-bold">{c?.name}</div><div>{c?.email}</div><div>{c?.phone || "—"}</div>{c && <Link href={`/admin/customers/${c.id}`} className="font-bold text-brand">View customer →</Link>}</div>
              <div>{o.address.name}<br />{o.address.line1}{o.address.line2 && `, ${o.address.line2}`}<br />{o.address.city}, {o.address.state} {o.address.postalCode}<br />{o.address.country} · 📞 {o.address.phone}</div>
            </div>
          </Panel>
          <Panel title="Payments">
            <p className="mb-2 text-sm">{o.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment"} · <Badge tone={statusTone(o.paymentStatus)}>{label(o.paymentStatus)}</Badge></p>
            {d.payments.length === 0 ? <p className="text-sm text-ink/50">No gateway transactions.</p> : (
              <ul className="space-y-1 text-xs">{d.payments.map((p: any) => <li key={p.id} className="rounded-xl bg-cream px-3 py-2"><strong>{p.provider}</strong> · {p.providerPaymentId || p.providerOrderId} · {inr(p.amount)} · {label(p.status)}{p.refundedAmount ? ` · refunded ${inr(p.refundedAmount)}` : ""}</li>)}</ul>
            )}
          </Panel>
          <Panel title="Activity">
            <ul className="space-y-1 text-sm text-ink/70">{[...o.history].reverse().map((h: any, n: number) => <li key={n}>{new Date(h.at).toLocaleString("en-IN")} — <strong>{label(h.status)}</strong>{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Status">
            <div className="mb-3"><Badge tone={statusTone(o.status)}>{label(o.status)}</Badge></div>
            {awaiting && <p className="mb-3 text-xs font-semibold text-amber-700">Awaiting customer payment.</p>}
            <div className="space-y-2">
              <Select label="Update status" value={status} disabled={closed || awaiting} onChange={(e) => setStatus(e.target.value)}>{NEXT.map((s) => <option key={s} value={s}>{label(s)}</option>)}{!NEXT.includes(o.status) && <option value={o.status}>{label(o.status)}</option>}</Select>
              <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button disabled={busy || closed || awaiting || status === o.status} className="btn btn-primary w-full" onClick={() => act({ status, note })}>Update status</button>
              <button disabled={busy || closed || o.status === "DELIVERED"} className="btn btn-ghost w-full !text-red-600" onClick={() => act({ action: "cancel" }, "Cancel this order? Stock will be restored.")}>Cancel order</button>
            </div>
          </Panel>
          <Panel title="Shipping & tracking">
            <div className="space-y-2">
              <Input label="Carrier" value={trk.carrier} onChange={(e) => setTrk({ ...trk, carrier: e.target.value })} placeholder="e.g. Delhivery" />
              <Input label="Tracking number" value={trk.number} onChange={(e) => setTrk({ ...trk, number: e.target.value })} />
              <Input label="Tracking link (https://…)" value={trk.url} onChange={(e) => setTrk({ ...trk, url: e.target.value })} />
              <button disabled={busy || !trk.carrier || !trk.number} className="btn btn-ghost w-full" onClick={() => act({ tracking: trk })}>Save tracking</button>
            </div>
          </Panel>
          <Panel title="Refund">
            {o.paymentStatus !== "PAID" ? <p className="text-sm text-ink/50">Only paid orders can be refunded.</p> : (
              <div className="space-y-2">
                <Input label="Amount (₹)" type="number" min={1} max={o.total - (o.refundedAmount ?? 0)} value={refund} onChange={(e) => setRefund(e.target.value)} placeholder={`Max ${o.total - (o.refundedAmount ?? 0)}`} />
                <button disabled={busy} className="btn btn-ghost w-full" onClick={() => act({ action: "refund", amount: refund || o.total - (o.refundedAmount ?? 0) }, "Issue this refund?")}>Issue refund</button>
                <p className="text-xs text-ink/50">Online payments are refunded through the gateway. For cash orders the refund is recorded here only.</p>
              </div>
            )}
          </Panel>
          <Err m={err} />
        </div>
      </div>
    </>
  );
}
