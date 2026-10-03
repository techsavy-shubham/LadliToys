"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, useStore } from "@/lib/client-state";
import AddressForm, { type Addr } from "./AddressForm";
import { Err, Field } from "./AuthForm";

export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useStore();
  const router = useRouter();
  useEffect(() => { if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(location.pathname)}`); }, [authLoading, user, router]);
  if (authLoading || !user) return <div className="container-x py-20 text-center text-ink/60">Loading…</div>;
  return <>{children}</>;
}

function Profile() {
  const { user, setUser, persistent } = useStore();
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", currentPassword: "", newPassword: "" });
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const body: any = { name: f.name, phone: f.phone };
    if (f.newPassword) { body.currentPassword = f.currentPassword; body.newPassword = f.newPassword; }
    const r = await api("/api/me", "PATCH", body);
    if (!r.ok) return setErr(r.data.error || "Could not update profile.");
    setUser(r.data.user); setOk("Profile updated."); setF({ ...f, currentPassword: "", newPassword: "" });
  }
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
      <h2 className="mb-4 text-xl font-extrabold">Profile</h2>
      {!persistent && <p className="mb-4 rounded-xl bg-sun/20 px-3 py-2 text-xs">Demo mode: no database is connected yet, so accounts reset when the server restarts.</p>}
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Field label="Phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <Field label="Email" value={user?.email ?? ""} disabled readOnly />
        <div />
        <Field label="Current password" type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
        <Field label="New password (optional)" type="password" minLength={8} autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} />
        <div className="space-y-2 sm:col-span-2"><Err m={err} />{ok && <p className="text-sm font-semibold text-emerald-700">{ok}</p>}<button className="btn btn-primary">Save changes</button></div>
      </form>
    </section>
  );
}

export function Addresses({ onPick, selected }: { onPick?: (id: string) => void; selected?: string }) {
  const [items, setItems] = useState<Addr[] | null>(null);
  const [editing, setEditing] = useState<Addr | "new" | null>(null);
  const load = () => api("/api/addresses").then((r) => {
    const list: Addr[] = r.data.items ?? []; setItems(list);
    if (onPick && !selected && list.length) onPick((list.find((a) => a.isDefault) ?? list[0]).id);
  });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    await api(`/api/addresses/${id}`, "DELETE"); load();
  }
  async function makeDefault(id: string) { await api(`/api/addresses/${id}`, "PATCH", { isDefault: true }); load(); }

  if (!items) return <p className="text-sm text-ink/60">Loading addresses…</p>;
  return (
    <div className="space-y-3">
      {items.length === 0 && editing !== "new" && <p className="text-sm text-ink/60">No saved addresses yet.</p>}
      {items.map((a) => editing && editing !== "new" && editing.id === a.id ? (
        <div key={a.id} className="rounded-2xl border-2 border-brand p-4"><AddressForm initial={a} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} /></div>
      ) : (
        <div key={a.id} className={`rounded-2xl border-2 p-4 text-sm ${onPick && selected === a.id ? "border-brand bg-brand/5" : "border-ink/10"}`}>
          <label className={`flex gap-3 ${onPick ? "cursor-pointer" : ""}`}>
            {onPick && <input type="radio" name="address" checked={selected === a.id} onChange={() => onPick(a.id)} />}
            <span>
              <strong>{a.name}</strong> {a.isDefault && <span className="ml-1 rounded-full bg-sun px-2 py-0.5 text-[10px] font-extrabold">DEFAULT</span>}<br />
              {a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.postalCode}, {a.country}<br />📞 {a.phone}
            </span>
          </label>
          <div className="mt-2 flex gap-3 text-xs font-bold text-brand">
            <button onClick={() => setEditing(a)}>Edit</button>
            <button onClick={() => remove(a.id)}>Delete</button>
            {!a.isDefault && <button onClick={() => makeDefault(a.id)}>Set as default</button>}
          </div>
        </div>
      ))}
      {editing === "new" ? (
        <div className="rounded-2xl border-2 border-brand p-4">
          <AddressForm onSaved={(a) => { setEditing(null); load(); onPick?.(a.id); }} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <button onClick={() => setEditing("new")} className="btn btn-ghost">+ Add new address</button>
      )}
    </div>
  );
}

export default function AccountView() {
  const { logout } = useStore();
  const router = useRouter();
  return (
    <RequireLogin>
      <div className="container-x space-y-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">My Account</h1>
          <div className="flex gap-2">
            <Link href="/account/orders" className="btn btn-ghost">My orders</Link>
            <Link href="/wishlist" className="btn btn-ghost">Wishlist</Link>
            <button onClick={async () => { await logout(); router.push("/"); }} className="btn btn-ghost">Log out</button>
          </div>
        </div>
        <Profile />
        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5"><h2 className="mb-4 text-xl font-extrabold">Saved addresses</h2><Addresses /></section>
      </div>
    </RequireLogin>
  );
}
