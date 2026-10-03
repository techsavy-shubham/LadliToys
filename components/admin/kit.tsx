"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-state";

export function useList<T = any>(url: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [extra, setExtra] = useState<any>({});
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const r = await api(url);
    if (!r.ok) { setError(r.data.error || "Could not load."); setItems([]); return; }
    setItems(r.data.items ?? []); setExtra(r.data); setError("");
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { items, extra, error, reload: load };
}

export const PageTitle = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold sm:text-3xl">{children}</h1>{action}</div>
);

export const Panel = ({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-3xl bg-white p-5 ring-1 ring-ink/5 ${className}`}>{title && <h2 className="mb-3 font-extrabold">{title}</h2>}{children}</section>
);

export const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5"><div className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</div><div className="mt-1 text-2xl font-extrabold">{value}</div>{sub && <div className="text-xs text-ink/50">{sub}</div>}</div>
);

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold">{title}</h2><button onClick={onClose} aria-label="Close" className="text-2xl leading-none text-ink/50">×</button></div>
        {children}
      </div>
    </div>
  );
}

export const Table = ({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) => (
  <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-ink/5">
    <table className="w-full min-w-[560px] text-left text-sm">
      <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50"><tr>{head.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-ink/5">{children}</tbody>
    </table>
    {empty && <p className="p-6 text-center text-ink/50">{empty}</p>}
  </div>
);
export const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;

export const Badge = ({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "green" | "red" | "amber" | "blue" }) => {
  const t = { gray: "bg-ink/10 text-ink/70", green: "bg-emerald-100 text-emerald-800", red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-800", blue: "bg-sky-100 text-sky-800" }[tone];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${t}`}>{children}</span>;
};
export const statusTone = (s: string) => (["DELIVERED", "PAID"].includes(s) ? "green" : ["CANCELLED", "FAILED", "REFUNDED"].includes(s) ? "red" : ["PENDING", "PENDING_PAYMENT", "PLACED"].includes(s) ? "amber" : "blue") as "green" | "red" | "amber" | "blue";
export const label = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const inp = "w-full rounded-xl border-2 border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand";
export function Input({ label: l, hint, ...p }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block text-sm font-bold">{l}<input {...p} className={`${inp} mt-1 font-normal`} />{hint && <span className="block text-xs font-normal text-ink/50">{hint}</span>}</label>;
}
export function Select({ label: l, children, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className="block text-sm font-bold">{l}<select {...p} className={`${inp} mt-1 font-normal`}>{children}</select></label>;
}
export function Textarea({ label: l, ...p }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className="block text-sm font-bold">{l}<textarea {...p} className={`${inp} mt-1 font-normal`} /></label>;
}
export function Check({ label: l, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" {...p} /> {l}</label>;
}
export const Err = ({ m }: { m: string }) => (m ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{m}</p> : null);
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
