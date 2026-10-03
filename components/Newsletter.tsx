"use client";
import { useState } from "react";
import { api } from "@/lib/client-state";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await api("/api/newsletter", "POST", { email });
    setBusy(false);
    setMsg({ ok: r.ok, text: r.ok ? "Thanks for subscribing! 🎉" : r.data.error || "Something went wrong." });
    if (r.ok) setEmail("");
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" aria-label="Newsletter email"
          className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/50 focus:ring-2 focus:ring-sun" />
        <button disabled={busy} className="btn btn-primary">{busy ? "…" : "Join"}</button>
      </div>
      {msg && <p role="status" className={`text-xs font-semibold ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
    </form>
  );
}
