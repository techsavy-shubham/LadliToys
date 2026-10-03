"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useStore } from "@/lib/client-state";
import { Stars } from "./ProductCard";

type Review = { id: string; name: string; rating: number; body: string; createdAt: string };

export default function Reviews({ slug, rating, count }: { slug: string; rating: number; count: number }) {
  const { user } = useStore();
  const [items, setItems] = useState<Review[]>([]);
  const [stars, setStars] = useState(0);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api(`/api/products/${slug}/reviews`).then((r) => setItems(r.data.items ?? [])); }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await api(`/api/products/${slug}/reviews`, "POST", { rating: stars, body });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error || "Could not submit review.");
    setItems((x) => [r.data.item, ...x]); setBody(""); setStars(0);
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-extrabold">Customer Reviews</h2>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
            <span className="text-3xl font-extrabold">{rating}</span><span className="text-ink/50"> / 5 </span>
            <Stars rating={rating} /> <span className="text-sm text-ink/60">· {count + items.length} ratings</span>
          </div>
          {items.length === 0 && <p className="rounded-3xl bg-white p-5 text-sm text-ink/60 ring-1 ring-ink/5">No written reviews yet. Be the first to share your experience!</p>}
          {items.map((r) => (
            <article key={r.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
              <div className="flex items-center justify-between"><Stars rating={r.rating} /><time className="text-xs text-ink/50">{new Date(r.createdAt).toLocaleDateString("en-IN")}</time></div>
              <p className="mt-2 text-sm">{r.body}</p>
              <p className="mt-2 text-xs font-bold text-ink/60">— {r.name}</p>
            </article>
          ))}
        </div>
        <div className="h-fit rounded-3xl bg-white p-5 ring-1 ring-ink/5">
          <h3 className="font-extrabold">Write a review</h3>
          {!user ? (
            <p className="mt-2 text-sm text-ink/70"><Link className="font-bold text-brand" href={`/login?next=/products/${slug}`}>Log in</Link> to review this toy.</p>
          ) : (
            <form onSubmit={submit} className="mt-3 space-y-3">
              <div role="radiogroup" aria-label="Rating" className="flex gap-1 text-3xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} className={n <= stars ? "text-amber-400" : "text-ink/20"}>★</button>
                ))}
              </div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={1000} placeholder="What did your child think?"
                className="w-full rounded-2xl border-2 border-ink/10 p-3 text-sm outline-none focus:border-brand" />
              {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
              <button disabled={busy} className="btn btn-primary w-full">{busy ? "Submitting…" : "Submit review"}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
