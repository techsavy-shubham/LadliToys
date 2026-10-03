"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, useStore } from "@/lib/client-state";

const input = "w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-12">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-ink/5">
        <h1 className="mb-5 text-2xl font-extrabold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
export const Err = ({ m }: { m: string }) => (m ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{m}</p> : null);
export const Field = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block text-sm font-bold">{label}<input {...p} className={`${input} mt-1 font-normal`} /></label>
);

function useNext() {
  const sp = useSearchParams();
  const n = sp.get("next") || "/account";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/account";
}

export function LoginForm() {
  const router = useRouter(); const next = useNext(); const { setUser } = useStore();
  const [f, setF] = useState({ email: "", password: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await api("/api/auth/login", "POST", f); setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Login failed.");
    setUser(r.data.user); router.push(next);
  }
  return (
    <Card title="Welcome back 👋">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Field label="Password" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Err m={err} />
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/forgot-password" className="font-bold text-brand">Forgot password?</Link>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-brand">Create account</Link>
      </div>
    </Card>
  );
}

export function RegisterForm() {
  const router = useRouter(); const next = useNext(); const { setUser } = useStore();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await api("/api/auth/register", "POST", f); setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Registration failed.");
    setUser(r.data.user); router.push(next);
  }
  return (
    <Card title="Create your account 🎈">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Field label="Email" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <Field label="Phone (optional)" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <Field label="Password (min 8 characters)" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Err m={err} />
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-4 text-sm">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-brand">Log in</Link></p>
    </Card>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState(""); const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [link, setLink] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setMsg(""); setLink("");
    const r = await api("/api/auth/forgot", "POST", { email });
    if (!r.ok) return setErr(r.data.error || "Something went wrong.");
    setMsg(r.data.message); setLink(r.data.devResetLink || "");
  }
  return (
    <Card title="Forgot your password?">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Err m={err} />
        {msg && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{msg}</p>}
        {link && (
          <p className="rounded-xl bg-sun/20 px-3 py-2 text-sm">Demo mode - use this link to continue: <Link href={link} className="font-bold text-brand underline">Reset password</Link></p>
        )}
        <button className="btn btn-primary w-full">Send reset link</button>
      </form>
      <p className="mt-4 text-sm"><Link href="/login" className="font-bold text-brand">← Back to login</Link></p>
    </Card>
  );
}

export function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await api("/api/auth/reset", "POST", { token, password: pw });
    if (!r.ok) return setErr(r.data.error || "Could not reset password.");
    setDone(true);
  }
  return (
    <Card title="Choose a new password">
      {done ? (
        <p className="text-sm">Your password has been updated. <Link href="/login" className="font-bold text-brand">Log in →</Link></p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password (min 8 characters)" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Err m={err} />
          <button className="btn btn-primary w-full">Update password</button>
        </form>
      )}
    </Card>
  );
}
