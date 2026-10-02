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
    featured: sp.featured === "true", isNew: sp.new === "true", sort: (sp.sort as SortKey) || "newest",
  };
  const result = queryProducts({ ...filters, limit: 12 });

  // Query string passed to the client for "load more" API calls
  const apiQs = new URLSearchParams(
    Object.entries({ q: sp.q, category: sp.category, age: sp.age, brand: sp.brand, featured: sp.featured, new: sp.new, sort: filters.sort, limit: "12" })
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
