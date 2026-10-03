import Link from "next/link";
import type { Metadata } from "next";
import LoadMoreGrid from "@/components/LoadMoreGrid";
import { ageGroups, brands, categories, queryProducts, type SortKey } from "@/lib/data";

export const metadata: Metadata = { title: "Shop All Toys" };

type SP = Record<string, string | undefined>;

const sorts: [SortKey, string][] = [["newest", "Newest"], ["popularity", "Popular"], ["rating", "Top rated"], ["price-asc", "Price ↑"], ["price-desc", "Price ↓"]];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters = {
    q: sp.q, category: sp.category, age: sp.age, brand: sp.brand,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined, maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    minRating: sp.rating ? Number(sp.rating) : undefined, inStock: sp.inStock === "true",
    featured: sp.featured === "true", isNew: sp.new === "true", sort: (sp.sort as SortKey) || "newest",
  };
  const result = queryProducts({ ...filters, limit: 12 });

  // Query string passed to the client for "load more" API calls
  const apiQs = new URLSearchParams(
    Object.entries({ q: sp.q, category: sp.category, age: sp.age, brand: sp.brand, featured: sp.featured, new: sp.new, minPrice: sp.minPrice, maxPrice: sp.maxPrice, rating: sp.rating, inStock: sp.inStock, sort: filters.sort, limit: "12" })
      .filter(([, v]) => v) as [string, string][],
  ).toString();

  const href = (patch: SP) => {
    const next: SP = { ...sp, ...patch };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };
  const chip = (active: boolean) =>
    `block rounded-full px-3 py-1.5 text-sm font-semibold transition ${active ? "bg-brand text-white" : "bg-white ring-1 ring-ink/10 hover:ring-brand"}`;

  const activeCat = categories.find((c) => c.slug === sp.category);
  const title = sp.q ? `Results for “${sp.q}”` : activeCat ? activeCat.name : "All Toys";

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-ink/60">{result.total} toy{result.total === 1 ? "" : "s"} found</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <form action="/products" className="space-y-3 rounded-3xl bg-white p-4 text-sm ring-1 ring-ink/5">
            {Object.entries(sp).filter(([k, v]) => v && !["minPrice", "maxPrice", "rating", "inStock"].includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink/50">Price (₹)</h2>
            <div className="flex items-center gap-2">
              <input name="minPrice" type="number" min={0} defaultValue={sp.minPrice} placeholder="Min" aria-label="Minimum price" className="w-full rounded-xl border-2 border-ink/10 px-2 py-1.5 outline-none focus:border-brand" />
              <span>–</span>
              <input name="maxPrice" type="number" min={0} defaultValue={sp.maxPrice} placeholder="Max" aria-label="Maximum price" className="w-full rounded-xl border-2 border-ink/10 px-2 py-1.5 outline-none focus:border-brand" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink/50">Rating</h2>
            <select name="rating" defaultValue={sp.rating ?? ""} aria-label="Minimum rating" className="w-full rounded-xl border-2 border-ink/10 px-2 py-1.5">
              <option value="">Any rating</option><option value="4.5">4.5★ & up</option><option value="4">4★ & up</option><option value="3">3★ & up</option>
            </select>
            <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="inStock" value="true" defaultChecked={sp.inStock === "true"} /> In stock only</label>
            <div className="flex gap-2"><button className="btn btn-primary !px-4 !py-1.5">Apply</button><Link href={href({ minPrice: undefined, maxPrice: undefined, rating: undefined, inStock: undefined })} className="btn btn-ghost !px-4 !py-1.5">Reset</Link></div>
          </form>
          <div>
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink/50">Category</h2>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
              <Link className={chip(!sp.category)} href={href({ category: undefined })}>All</Link>
              {categories.map((c) => <Link key={c.id} className={chip(sp.category === c.slug)} href={href({ category: c.slug })}>{c.emoji} {c.name}</Link>)}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink/50">Age</h2>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
              <Link className={chip(!sp.age)} href={href({ age: undefined })}>Any age</Link>
              {ageGroups.map((a) => <Link key={a.slug} className={chip(sp.age === a.slug)} href={href({ age: a.slug })}>{a.label}</Link>)}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-ink/50">Brand</h2>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
              <Link className={chip(!sp.brand)} href={href({ brand: undefined })}>All brands</Link>
              {brands.map((b) => <Link key={b.id} className={chip(sp.brand === b.slug)} href={href({ brand: b.slug })}>{b.name}</Link>)}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold">Sort:</span>
            {sorts.map(([k, l]) => <Link key={k} className={chip(filters.sort === k)} href={href({ sort: k })}>{l}</Link>)}
          </div>
          {result.items.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-ink/5">
              <div className="text-5xl">🔍</div>
              <p className="mt-3 font-bold">No toys match your filters.</p>
              <Link href="/products" className="btn btn-primary mt-4">Clear filters</Link>
            </div>
          ) : (
            <LoadMoreGrid key={apiQs} initial={result.items} hasMore={result.hasMore} query={apiQs} />
          )}
        </section>
      </div>
    </div>
  );
}
